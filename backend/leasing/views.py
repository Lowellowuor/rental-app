from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from datetime import date
from .models import LeaseAgreement, Invoice
from .serializers import LeaseAgreementSerializer, InvoiceSerializer
from .permissions import IsMainTenantOrLeaseHolder

class LeaseAgreementViewSet(viewsets.ModelViewSet):
    queryset = LeaseAgreement.objects.all().select_related(
        'room', 'room__house', 'sub_tenant'
    ).prefetch_related('invoices')
    serializer_class = LeaseAgreementSerializer
    permission_classes = [IsMainTenantOrLeaseHolder]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUB_TENANT':
            return self.queryset.filter(sub_tenant=user)
        elif user.role == 'MAIN_TENANT':
            return self.queryset.filter(room__house__main_tenant=user)
        return self.queryset

    @transaction.atomic
    def perform_create(self, serializer):
        lease = serializer.save()
        self._generate_first_invoice(lease)

    @transaction.atomic
    def _generate_first_invoice(self, lease):
        """Generate the first invoice for a new lease"""
        from dateutil.relativedelta import relativedelta
        
        # Calculate period (one month from start date)
        period_start = lease.start_date
        period_end = lease.start_date + relativedelta(months=1) - relativedelta(days=1)
        
        Invoice.objects.create(
            lease=lease,
            period_start=period_start,
            period_end=period_end,
            due_date=lease.next_invoice_date,
            base_rent=lease.monthly_rent,
            utility_bills_split=0,
            late_fee_charged=0,
            total_amount=lease.monthly_rent,
            balance_due=lease.monthly_rent,
            status='pending'
        )

    @action(detail=True, methods=['post'])
    def generate_next_invoice(self, request, pk=None):
        """Manual trigger to generate the next invoice"""
        lease = self.get_object()
        next_invoice_date = lease.next_invoice_date
        
        # Check if we need to generate
        if next_invoice_date > date.today():
            return Response(
                {"detail": f"Next invoice not due until {next_invoice_date}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if invoice already exists for this period
        if Invoice.objects.filter(lease=lease, due_date=next_invoice_date).exists():
            return Response(
                {"detail": "Invoice already exists for this period"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate invoice
        from dateutil.relativedelta import relativedelta
        period_start = next_invoice_date
        period_end = next_invoice_date + relativedelta(months=1) - relativedelta(days=1)
        
        Invoice.objects.create(
            lease=lease,
            period_start=period_start,
            period_end=period_end,
            due_date=next_invoice_date,
            base_rent=lease.monthly_rent,
            utility_bills_split=0,
            late_fee_charged=0,
            total_amount=lease.monthly_rent,
            balance_due=lease.monthly_rent,
            status='pending'
        )
        
        # Update next invoice date
        lease.next_invoice_date = lease.generate_next_invoice_date()
        lease.save()
        
        return Response(
            {"detail": f"Invoice generated for {next_invoice_date}"},
            status=status.HTTP_201_CREATED
        )

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().select_related(
        'lease', 'lease__sub_tenant', 'lease__room'
    )
    serializer_class = InvoiceSerializer
    permission_classes = [IsMainTenantOrLeaseHolder]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUB_TENANT':
            return self.queryset.filter(lease__sub_tenant=user)
        elif user.role == 'MAIN_TENANT':
            return self.queryset.filter(lease__room__house__main_tenant=user)
        return self.queryset

    @action(detail=True, methods=['patch'])
    def mark_paid(self, request, pk=None):
        """Mark an invoice as paid"""
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.balance_due = 0
        invoice.save()
        return Response(
            {"detail": "Invoice marked as paid"},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def apply_late_fee(self, request, pk=None):
        """Apply late fee to an overdue invoice"""
        invoice = self.get_object()
        if invoice.status == 'paid':
            return Response(
                {"detail": "Cannot apply late fee to paid invoice"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        late_fee = invoice.base_rent * (invoice.lease.late_fee_percentage / 100)
        invoice.late_fee_charged = late_fee
        invoice.total_amount = invoice.calculate_total()
        invoice.balance_due = invoice.total_amount
        invoice.status = 'overdue'
        invoice.save()
        
        return Response(
            {"detail": f"Late fee of {late_fee} applied"},
            status=status.HTTP_200_OK
        )
