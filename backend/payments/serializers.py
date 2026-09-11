from rest_framework import serializers

from .models import MPESATransaction


class MPESATransactionListSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.username", read_only=True, default=None)
    invoice_reference = serializers.CharField(source="invoice.reference", read_only=True, default=None)

    class Meta:
        model = MPESATransaction
        fields = (
            "id",
            "invoice",
            "invoice_reference",
            "tenant",
            "tenant_name",
            "amount",
            "phone_number",
            "mpesa_receipt_number",
            "status",
            "created_at",
        )
        read_only_fields = fields


class MPESATransactionSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.username", read_only=True, default=None)
    tenant_email = serializers.EmailField(source="tenant.email", read_only=True, default=None)
    invoice_reference = serializers.CharField(source="invoice.reference", read_only=True, default=None)
    invoice_amount = serializers.DecimalField(
        source="invoice.total_amount",
        read_only=True,
        max_digits=12,
        decimal_places=2,
        default=None,
    )
    invoice_balance_due = serializers.DecimalField(
        source="invoice.balance_due",
        read_only=True,
        max_digits=12,
        decimal_places=2,
        default=None,
    )

    class Meta:
        model = MPESATransaction
        fields = (
            "id",
            "invoice",
            "invoice_reference",
            "invoice_amount",
            "invoice_balance_due",
            "tenant",
            "tenant_name",
            "tenant_email",
            "amount",
            "phone_number",
            "merchant_request_id",
            "checkout_request_id",
            "mpesa_receipt_number",
            "status",
            "result_description",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "invoice",
            "tenant",
            "amount",
            "phone_number",
            "merchant_request_id",
            "checkout_request_id",
            "mpesa_receipt_number",
            "status",
            "result_description",
            "created_at",
            "updated_at",
        )


class InitiatePaymentSerializer(serializers.Serializer):
    invoice_id = serializers.IntegerField(min_value=1)
    phone_number = serializers.CharField(max_length=20, trim_whitespace=True)

    def validate_phone_number(self, value):
        digits = "".join(ch for ch in str(value) if ch.isdigit())
        if digits.startswith("0"):
            digits = "254" + digits[1:]
        elif digits.startswith("7") or digits.startswith("1"):
            digits = "254" + digits

        if len(digits) != 12 or not digits.startswith("254"):
            raise serializers.ValidationError("Enter a valid Kenyan phone number, e.g. 0712 345 678.")

        return digits


class MPESATransactionStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = MPESATransaction
        fields = ("id", "status", "mpesa_receipt_number", "result_description", "updated_at")
        read_only_fields = fields