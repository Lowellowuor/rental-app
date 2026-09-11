from rest_framework import serializers

from .models import MaintenanceTicket


class MaintenanceTicketListSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.username", read_only=True)
    house_number = serializers.CharField(source="house.house_number", read_only=True, default=None)
    estate_name = serializers.CharField(source="estate.name", read_only=True, default=None)
    assigned_to_name = serializers.CharField(source="assigned_to.username", read_only=True, default=None)

    class Meta:
        model = MaintenanceTicket
        fields = (
            "id",
            "tenant",
            "tenant_name",
            "title",
            "category",
            "priority",
            "status",
            "house_number",
            "estate_name",
            "assigned_to",
            "assigned_to_name",
            "created_at",
            "resolved_at",
        )
        read_only_fields = fields


class MaintenanceTicketSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.username", read_only=True)
    tenant_phone = serializers.CharField(source="tenant.phone_number", read_only=True, default="")
    estate_name = serializers.CharField(source="estate.name", read_only=True, default=None)
    house_number = serializers.CharField(source="house.house_number", read_only=True, default=None)
    room_name = serializers.CharField(source="room.room_name", read_only=True, default=None)
    assigned_to_name = serializers.CharField(source="assigned_to.username", read_only=True, default=None)

    class Meta:
        model = MaintenanceTicket
        fields = (
            "id",
            "tenant",
            "tenant_name",
            "tenant_phone",
            "estate",
            "estate_name",
            "house",
            "house_number",
            "room",
            "room_name",
            "title",
            "description",
            "category",
            "priority",
            "status",
            "assigned_to",
            "assigned_to_name",
            "resolved_at",
            "resolved_by",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "tenant",
            "status",
            "resolved_at",
            "resolved_by",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {
            "house": {"required": False, "allow_null": True},
            "room": {"required": False, "allow_null": True},
            "estate": {"required": False, "allow_null": True},
            "assigned_to": {"required": False, "allow_null": True},
        }

    def validate_title(self, value):
        if value and len(value.strip()) < 4:
            raise serializers.ValidationError("Use at least 4 characters.")
        return value.strip() if value else value

    def validate_description(self, value):
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError("Describe the issue in at least 10 characters.")
        return value.strip()


class MaintenanceTicketStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=MaintenanceTicket.Status.choices)

    def validate_status(self, value):
        allowed = MaintenanceTicket.Status.values
        if value not in allowed:
            raise serializers.ValidationError(f"Invalid status. Choose from: {', '.join(allowed)}.")
        return value


class MaintenanceTicketNoteSerializer(serializers.Serializer):
    note = serializers.CharField(max_length=2000, trim_whitespace=True)

    def validate_note(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Note must be at least 3 characters.")
        return value.strip()