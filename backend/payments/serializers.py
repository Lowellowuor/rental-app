from rest_framework import serializers
from .models import MPESATransaction

class MPESATransactionSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.username', read_only=True)
    invoice_amount = serializers.DecimalField(source='invoice.total_amount', read_only=True, max_digits=10, decimal_places=2)
    
    class Meta:
        model = MPESATransaction
        fields = (
            'id', 'invoice', 'invoice_amount', 'tenant', 'tenant_name',
            'amount', 'phone_number', 'merchant_request_id', 'checkout_request_id',
            'mpesa_receipt_number', 'status', 'result_description', 'created_at'
        )
        read_only_fields = ('merchant_request_id', 'checkout_request_id', 'status')
