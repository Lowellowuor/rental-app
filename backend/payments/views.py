from django.db import transaction
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from leasing.models import Invoice

from .models import MPESATransaction
from .permissions import IsTransactionOwnerOrManager
from .serializers import (
    InitiatePaymentSerializer,
    MPESATransactionSerializer,
    MPESATransactionStatusSerializer,
)
from .services import MPESAService, normalize_phone


class PaymentInitiateThrottle(UserRateThrottle):
    scope = "payment_initiate"


class MPESATransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MPESATransactionSerializer
    permission_classes = [IsAuthenticated, IsTransactionOwnerOrManager]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "invoice"]
    search_fields = ["checkout_request_id", "mpesa_receipt_number", "phone_number"]
    ordering_fields = ["created_at", "amount"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        qs = MPESATransaction.objects.select_related(
            "tenant",
            "invoice",
            "invoice__lease",
            "invoice__lease__room",
            "invoice__lease__room__house",
            "invoice__lease__room__house__estate",
        )

        role = getattr(user, "role", None)

        if role in ("ADMIN", "ACCOUNTANT"):
            return qs

        if role == "LANDLORD":
            return qs.filter(invoice__lease__room__house__estate__landlord=user)

        if role == "ESTATE_MANAGER":
            return qs.filter(invoice__lease__room__house__estate__manager=user)

        return qs.filter(tenant=user)

    @action(
        detail=False,
        methods=["post"],
        throttle_classes=[PaymentInitiateThrottle],
        url_path="initiate",
    )
    def initiate_payment(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        invoice = get_object_or_404(
            Invoice.objects.select_related(
                "lease",
                "lease__room",
                "lease__room__house",
                "lease__room__house__estate",
            ),
            pk=serializer.validated_data["invoice_id"],
        )

        if not self._can_pay_invoice(request.user, invoice):
            return Response(
                {"detail": "You do not have permission to pay this invoice."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if invoice.status == Invoice.Status.PAID:
            return Response(
                {"detail": "Invoice is already paid."},
                status=status.HTTP_409_CONFLICT,
            )

        if invoice.balance_due <= 0:
            return Response(
                {"detail": "Invoice has no outstanding balance."},
                status=status.HTTP_409_CONFLICT,
            )

        existing = MPESATransaction.objects.filter(
            invoice=invoice,
            status=MPESATransaction.Status.PROCESSING,
            tenant=request.user,
        ).first()

        if existing:
            return Response(
                {
                    "detail": "A payment for this invoice is already being processed.",
                    "transaction": MPESATransactionSerializer(existing).data,
                },
                status=status.HTTP_409_CONFLICT,
            )

        phone_number = normalize_phone(serializer.validated_data["phone_number"])
        amount = invoice.balance_due
        account_reference = f"INV{invoice.id}"
        house_number = invoice.lease.room.house.house_number

        try:
            mpesa = MPESAService()
            response = mpesa.stk_push(
                phone_number=phone_number,
                amount=amount,
                account_reference=account_reference,
                transaction_desc=f"Rent Payment - {house_number}",
            )
        except Exception:
            return Response(
                {"detail": "Could not reach M-PESA. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        merchant_request_id = response.get("MerchantRequestID")
        checkout_request_id = response.get("CheckoutRequestID")

        if not checkout_request_id:
            return Response(
                {"detail": "M-PESA did not return a checkout ID."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        with transaction.atomic():
            mpesa_transaction = MPESATransaction.objects.create(
                invoice=invoice,
                tenant=request.user,
                amount=amount,
                phone_number=phone_number,
                merchant_request_id=merchant_request_id,
                checkout_request_id=checkout_request_id,
                status=MPESATransaction.Status.PROCESSING,
            )

        return Response(
            {
                "transaction": MPESATransactionSerializer(mpesa_transaction).data,
                "message": "Enter your M-PESA PIN to complete payment.",
            },
            status=status.HTTP_202_ACCEPTED,
        )

    @action(detail=True, methods=["get"], url_path="status")
    def check_status(self, request, pk=None):
        transaction_obj = self.get_object()
        return Response(MPESATransactionStatusSerializer(transaction_obj).data)

    @staticmethod
    def _can_pay_invoice(user, invoice):
        role = getattr(user, "role", None)

        if role in ("ADMIN", "ESTATE_MANAGER"):
            return True

        if role in ("TENANT", "SUB_TENANT"):
            if invoice.tenant_id == user.id:
                return True
            return invoice.lease.room.house.main_tenant_id == user.id

        return False