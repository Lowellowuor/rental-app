from dateutil.relativedelta import relativedelta
from django.db import transaction
from django.db.models import Count, Prefetch, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from .models import Invoice, LeaseAgreement
from .permissions import CanManageInvoice, CanManageLease
from .serializers import (
    InvoiceListSerializer,
    InvoiceSerializer,
    LeaseAgreementListSerializer,
    LeaseAgreementSerializer,
)


class InvoiceGenerateThrottle(UserRateThrottle):
    scope = "invoice_generate"


class LeaseAgreementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CanManageLease]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "room", "tenant", "is_lease_holder"]
    search_fields = ["tenant__username", "tenant__phone_number", "room__house__house_number"]
    ordering_fields = ["start_date", "monthly_rent", "created_at", "next_invoice_date"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)

        qs = (
            LeaseAgreement.objects
            .select_related(
                "tenant",
                "room",
                "room__house",
                "room__house__estate",
                "room__house__estate__landlord",
                "room__house__estate__manager",
                "room__house__estate__caretaker",
            )
            .annotate(invoice_count=Count("invoices", distinct=True))
        )

        if role == "ADMIN":
            return qs

        if role == "LANDLORD":
            return qs.filter(room__house__estate__landlord=user)

        if role == "ESTATE_MANAGER":
            return qs.filter(room__house__estate__manager=user)

        if role == "CARETAKER":
            return qs.filter(room__house__estate__caretaker=user)

        if role in ("ACCOUNTANT", "AGENT"):
            return qs

        if role in ("TENANT", "SUB_TENANT"):
            return qs.filter(
                Q(tenant=user) | Q(room__house__main_tenant=user)
            ).distinct()

        return qs.none()

    def get_serializer_class(self):
        if self.action == "list":
            return LeaseAgreementListSerializer
        return LeaseAgreementSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        lease = serializer.save()
        self._generate_first_invoice(lease)

        room = lease.room
        if not room.is_occupied:
            room.is_occupied = True
            if room.main_tenant_id is None and lease.tenant.role in ("TENANT", "SUB_TENANT"):
                room.main_tenant = lease.tenant
            room.save(update_fields=["is_occupied", "main_tenant", "updated_at"])

    def _generate_first_invoice(self, lease):
        period_start = lease.start_date
        period_end = lease.start_date + relativedelta(months=1) - relativedelta(days=1)

        Invoice.objects.create(
            lease=lease,
            period_start=period_start,
            period_end=period_end,
            due_date=lease.next_invoice_date,
            base_rent=lease.monthly_rent,
            utility_bills_split=0,
            other_charges=0,
            late_fee_charged=0,
            total_amount=lease.monthly_rent,
            balance_due=lease.monthly_rent,
            status=Invoice.Status.PENDING,
            created_by=self.request.user,
        )

    @action(detail=True, methods=["post"], url_path="generate-invoice",
            throttle_classes=[InvoiceGenerateThrottle])
    def generate_next_invoice(self, request, pk=None):
        lease = self.get_object()

        if lease.status != LeaseAgreement.Status.ACTIVE:
            return Response(
                {"detail": "Only active leases can generate new invoices."},
                status=status.HTTP_409_CONFLICT,
            )

        next_date = lease.next_invoice_date
        if next_date > timezone.now().date():
            return Response(
                {"detail": f"Next invoice not due until {next_date}."},
                status=status.HTTP_409_CONFLICT,
            )

        if Invoice.objects.filter(lease=lease, due_date=next_date).exists():
            lease.advance_next_invoice_date()
            lease.save(update_fields=["next_invoice_date", "updated_at"])
            return Response(
                {"detail": "Invoice already exists for this period."},
                status=status.HTTP_409_CONFLICT,
            )

        period_start = next_date
        period_end = next_date + relativedelta(months=1) - relativedelta(days=1)

        with transaction.atomic():
            invoice = Invoice.objects.create(
                lease=lease,
                period_start=period_start,
                period_end=period_end,
                due_date=next_date,
                base_rent=lease.monthly_rent,
                utility_bills_split=0,
                other_charges=0,
                late_fee_charged=0,
                total_amount=lease.monthly_rent,
                balance_due=lease.monthly_rent,
                status=Invoice.Status.PENDING,
                created_by=request.user,
            )
            lease.advance_next_invoice_date()
            lease.save(update_fields=["next_invoice_date", "updated_at"])

        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="terminate")
    def terminate(self, request, pk=None):
        lease = self.get_object()

        if lease.status == LeaseAgreement.Status.TERMINATED:
            return Response(
                {"detail": "Lease is already terminated."},
                status=status.HTTP_409_CONFLICT,
            )

        with transaction.atomic():
            lease.status = LeaseAgreement.Status.TERMINATED
            lease.end_date = lease.end_date or timezone.now().date()
            lease.save(update_fields=["status", "end_date", "updated_at"])

            room = lease.room
            if room.main_tenant_id == lease.tenant_id:
                room.main_tenant = None
                room.is_occupied = False
                room.save(update_fields=["main_tenant", "is_occupied", "updated_at"])

        return Response(LeaseAgreementSerializer(lease).data)


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CanManageInvoice]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "lease"]
    search_fields = ["lease__tenant__username", "lease__room__house__house_number"]
    ordering_fields = ["due_date", "total_amount", "balance_due", "created_at"]
    ordering = ["-due_date"]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)

        qs = Invoice.objects.select_related(
            "lease",
            "lease__tenant",
            "lease__room",
            "lease__room__house",
            "lease__room__house__estate",
            "lease__room__house__estate__landlord",
            "lease__room__house__estate__manager",
            "lease__room__house__estate__caretaker",
        )

        if role == "ADMIN":
            return qs

        if role == "LANDLORD":
            return qs.filter(lease__room__house__estate__landlord=user)

        if role == "ESTATE_MANAGER":
            return qs.filter(lease__room__house__estate__manager=user)

        if role == "CARETAKER":
            return qs.filter(lease__room__house__estate__caretaker=user)

        if role in ("ACCOUNTANT", "AGENT"):
            return qs

        if role in ("TENANT", "SUB_TENANT"):
            return qs.filter(lease__tenant=user)

        return qs.none()

    def get_serializer_class(self):
        if self.action == "list":
            return InvoiceListSerializer
        return InvoiceSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()

        if invoice.status == Invoice.Status.PAID:
            return Response(
                {"detail": "Invoice is already paid."},
                status=status.HTTP_409_CONFLICT,
            )

        invoice.status = Invoice.Status.PAID
        invoice.balance_due = 0
        invoice.paid_at = timezone.now()
        invoice.save(update_fields=["status", "balance_due", "paid_at", "updated_at"])

        return Response(InvoiceSerializer(invoice).data)

    @action(detail=True, methods=["post"], url_path="apply-late-fee")
    def apply_late_fee(self, request, pk=None):
        invoice = self.get_object()

        if invoice.status == Invoice.Status.PAID:
            return Response(
                {"detail": "Cannot apply late fee to a paid invoice."},
                status=status.HTTP_409_CONFLICT,
            )

        if invoice.status == Invoice.Status.CANCELLED:
            return Response(
                {"detail": "Cannot apply late fee to a cancelled invoice."},
                status=status.HTTP_409_CONFLICT,
            )

        pct = invoice.lease.late_fee_percentage
        late_fee = (invoice.base_rent * pct) / 100

        invoice.late_fee_charged = late_fee
        invoice.recalculate()
        invoice.status = Invoice.Status.OVERDUE
        invoice.save(update_fields=[
            "late_fee_charged", "total_amount", "balance_due", "status", "updated_at",
        ])

        return Response(InvoiceSerializer(invoice).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        invoice = self.get_object()

        if invoice.status == Invoice.Status.PAID:
            return Response(
                {"detail": "Cannot cancel a paid invoice."},
                status=status.HTTP_409_CONFLICT,
            )

        invoice.status = Invoice.Status.CANCELLED
        invoice.balance_due = 0
        invoice.save(update_fields=["status", "balance_due", "updated_at"])

        return Response(InvoiceSerializer(invoice).data)