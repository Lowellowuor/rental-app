from rest_framework import serializers
from .models import LeaseAgreement, Invoice
from properties.serializers import RoomSerializer

class LeaseAgreementSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source='room.room_name', read_only=True)
    sub_tenant_name = serializers.CharField(source='sub_tenant.username', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = LeaseAgreement
        fields = (
            'id', 'room', 'room_details', 'room_number', 'sub_tenant', 'sub_tenant_name',
            'start_date', 'end_date', 'monthly_rent', 'rent_due_day',
            'late_fee_percentage', 'deposit_amount', 'next_invoice_date',
            'status'
        )
        read_only_fields = ('next_invoice_date',)

class InvoiceSerializer(serializers.ModelSerializer):
    lease_info = serializers.CharField(source='lease.__str__', read_only=True)
    tenant_name = serializers.CharField(source='lease.sub_tenant.username', read_only=True)
    lease_details = LeaseAgreementSerializer(source='lease', read_only=True)
    
    class Meta:
        model = Invoice
        fields = (
            'id', 'lease', 'lease_details', 'lease_info', 'tenant_name',
            'period_start', 'period_end', 'due_date',
            'base_rent', 'utility_bills_split', 'late_fee_charged',
            'total_amount', 'balance_due', 'status', 'pdf_file'
        )
        read_only_fields = ('total_amount',)
