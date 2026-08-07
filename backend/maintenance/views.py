from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import MaintenanceTicket
from .serializers import MaintenanceTicketSerializer

class IsMaintenanceAllowed(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role in ['SUB_TENANT', 'MAIN_TENANT', 'ESTATE_MANAGER', 'SUPER_ADMIN']

class MaintenanceTicketViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceTicket.objects.all().select_related('tenant', 'house')
    serializer_class = MaintenanceTicketSerializer
    permission_classes = [IsMaintenanceAllowed]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUB_TENANT':
            return self.queryset.filter(tenant=user)
        elif user.role == 'MAIN_TENANT':
            return self.queryset.filter(house__main_tenant=user)
        return self.queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        data = serializer.validated_data
        if not data.get('house') and user.role == 'SUB_TENANT':
            from leasing.models import LeaseAgreement
            active_lease = LeaseAgreement.objects.filter(sub_tenant=user, status='active').first()
            if active_lease:
                data['house'] = active_lease.room.house
        serializer.save(tenant=user)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        status = request.data.get('status')
        if not status:
            return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
        ticket.status = status
        if status == 'resolved':
            ticket.resolved_at = timezone.now()
        ticket.save()
        return Response(MaintenanceTicketSerializer(ticket).data)
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        ticket = self.get_object()
        note = request.data.get('note')
        if not note:
            return Response({'error': 'Note is required'}, status=status.HTTP_400_BAD_REQUEST)
        if ticket.notes:
            ticket.notes += f'\n{timezone.now()}: {note}'
        else:
            ticket.notes = f'{timezone.now()}: {note}'
        ticket.save()
        return Response(MaintenanceTicketSerializer(ticket).data)
