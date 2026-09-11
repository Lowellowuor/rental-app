from rest_framework import serializers

from properties.models import Room

from .models import Invoice, LeaseAgreement


class RoomBriefSerializer(serializers.ModelSerializer):
    house_number = serializers.CharField(source="house.house_number", read_only=True)
    estate_name = serializers.CharField(source="house.estate.name", read_only=True)

    class Meta:
        model = Room
        fields = ("id", "room_name", "is_occupied", "house", "house_number", "estate_name")


class LeaseAgreementListSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.username", read_only=True)
    house_number = serializers.CharField(source="room.house.house_number", read_only=True)
    estate_name = serializers.CharField(source="room.house.estate.name", read_only=True)
    room_name = serializers.CharField(source="room.room_name", read_only=True)

    class Meta:
        model = LeaseAgreement
        fields = (
            "id",
            "tenant",
            "tenant_name",
            "room",
            "room_name",
            "house_number",
            "estate_name",
            "monthly_rent",
            "start_date",
            "end_date",
            "next_invoice_date",
            "status",
            "is_lease_holder",
        )
        read_only_fields = fields


class LeaseAgreementSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.username", read_only=True)
    tenant_phone = serializers.CharField(source="tenant.phone_number", read_only=True)
    room_details = RoomBriefSerializer(source="room", read_only=True)
    invoice_count = serializers.SerializerMethodField()

    class Meta:
        model = LeaseAgreement
        fields = (
            "id",
            "room",
            "room_details",
            "tenant",
            "tenant_name",
            "tenant_phone",
            "is_lease_holder",
            "start_date",
            "end_date",
            "monthly_rent",
            "rent_due_day",
            "late_fee_percentage",
            "deposit_amount",
            "next_invoice_date",
            "status",
            "invoice_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "next_invoice_date", "created_at", "updated_at")

    def get_invoice_count(self, obj):
        return obj.invoices.count()

    def validate(self, attrs):
        start = attrs.get("start_date") or getattr(self.instance, "start_date", None)
        end = attrs.get("end_date") or getattr(self.instance, "end_date", None)
        room = attrs.get("room") or getattr(self.instance, "room", None)

        if start and end and end <= start:
            raise serializers.ValidationError({"end_date": "End date must be after start date."})

        if room and getattr(room, "is_occupied", False) and not self.instance:
            raise serializers.ValidationError({"room": "This room is already occupied."})

        rent_due_day = attrs.get("rent_due_day") or getattr(self.instance, "rent_due_day", None)
        if rent_due_day and not 1 <= rent_due_day <= 28:
            raise serializers.ValidationError({"rent_due_day": "Choose a day between 1 and 28."})

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        return super().create(validated_data)


class InvoiceListSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="lease.tenant.username", read_only=True)
    house_number = serializers.CharField(source="lease.room.house.house_number", read_only=True)
    room_name = serializers.CharField(source="lease.room.room_name", read_only=True)

    class Meta:
        model = Invoice
        fields = (
            "id",
            "reference",
            "lease",
            "tenant_name",
            "house_number",
            "room_name",
            "period_start",
            "period_end",
            "due_date",
            "total_amount",
            "balance_due",
            "status",
        )
        read_only_fields = fields


class InvoiceSerializer(serializers.ModelSerializer):
    reference = serializers.CharField(read_only=True)
    tenant_name = serializers.CharField(source="lease.tenant.username", read_only=True)
    tenant_phone = serializers.CharField(source="lease.tenant.phone_number", read_only=True)
    house_number = serializers.CharField(source="lease.room.house.house_number", read_only=True)
    room_name = serializers.CharField(source="lease.room.room_name", read_only=True)
    estate_name = serializers.CharField(source="lease.room.house.estate.name", read_only=True)

    class Meta:
        model = Invoice
        fields = (
            "id",
            "reference",
            "lease",
            "tenant_name",
            "tenant_phone",
            "house_number",
            "room_name",
            "estate_name",
            "period_start",
            "period_end",
            "due_date",
            "base_rent",
            "utility_bills_split",
            "other_charges",
            "late_fee_charged",
            "total_amount",
            "balance_due",
            "status",
            "pdf_file",
            "paid_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "reference",
            "total_amount",
            "balance_due",
            "paid_at",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):
        period_start = attrs.get("period_start") or getattr(self.instance, "period_start", None)
        period_end = attrs.get("period_end") or getattr(self.instance, "period_end", None)

        if period_start and period_end and period_end < period_start:
            raise serializers.ValidationError(
                {"period_end": "Period end must be on or after period start."}
            )

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        return super().create(validated_data)