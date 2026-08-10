from rest_framework import serializers
from .models import MaintenanceTicket

class MaintenanceTicketSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.username', read_only=True)
    house_number = serializers.CharField(source='house.house_number', read_only=True, allow_null=True)

    class Meta:
        model = MaintenanceTicket
        fields = (
            'id', 'tenant', 'tenant_name', 'house', 'house_number',
            'description', 'priority', 'status', 'created_at', 'updated_at',
            'resolved_at', 'notes'
        )
        read_only_fields = ('created_at', 'updated_at', 'resolved_at', 'status', 'tenant')
        extra_kwargs = {
            'house': {'required': False, 'allow_null': True},
        }
