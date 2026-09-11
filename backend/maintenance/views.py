from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import MaintenanceTicket
from .permissions import CanManageTicket, CanUpdateTicketStatus
from .serializers import (
    MaintenanceTicketListSerializer,
    MaintenanceTicketNoteSerializer,
    MaintenanceTicketSerializer,
    MaintenanceTicketStatusSerializer,
)


class MaintenanceTicketViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CanManageTicket]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "priority", "category", "estate", "house", "assigned_to"]
    search_fields = ["title", "description", "tenant__username", "house__house_number"]
    ordering_fields = ["created_at", "priority", "status", "resolved_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)

        qs = MaintenanceTicket.objects.select_related(
            "tenant",
            "estate",
            "house",
            "room",
            "assigned_to",
            "resolved_by",
            "estate__landlord",
            "estate__manager",
            "estate__caretaker",
        )

        if role == "ADMIN":
            return qs

        if role == "LANDLORD":
            return qs.filter(estate__landlord=user)

        if role == "ESTATE_MANAGER":
            return qs.filter(estate__manager=user)

        if role == "CARETAKER":
            return qs.filter(
                Q(estate__caretaker=user) | Q(assigned_to=user)
            ).distinct()

        if role in ("ACCOUNTANT", "AGENT"):
            return qs

        if role in ("TENANT", "SUB_TENANT"):
            return qs.filter(
                Q(tenant=user) | Q(house__main_tenant=user)
            ).distinct()

        return qs.none()

    def get_serializer_class(self):
        if self.action == "list":
            return MaintenanceTicketListSerializer
        if self.action == "update_status":
            return MaintenanceTicketStatusSerializer
        if self.action == "add_note":
            return MaintenanceTicketNoteSerializer
        return MaintenanceTicketSerializer

    def perform_create(self, serializer):
        user = self.request.user
        data = serializer.validated_data

        estate = data.get("estate")
        house = data.get("house")
        room = data.get("room")

        if not room and getattr(user, "role", None) in ("TENANT", "SUB_TENANT"):
            from leasing.models import LeaseAgreement

            lease = (
                LeaseAgreement.objects
                .filter(tenant=user, status=LeaseAgreement.Status.ACTIVE)
                .select_related("room", "room__house", "room__house__estate")
                .first()
            )
            if lease:
                room = lease.room
                house = room.house
                estate = room.house.estate

        if house and not estate:
            estate = house.estate

        serializer.save(
            tenant=user,
            estate=estate,
            house=house,
            room=room,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="status",
        permission_classes=[IsAuthenticated, CanUpdateTicketStatus],
    )
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        serializer = MaintenanceTicketStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]

        if ticket.status == MaintenanceTicket.Status.CANCELLED:
            return Response(
                {"detail": "Cannot update a cancelled ticket."},
                status=status.HTTP_409_CONFLICT,
            )

        ticket.status = new_status

        if new_status == MaintenanceTicket.Status.RESOLVED:
            ticket.resolved_at = timezone.now()
            ticket.resolved_by = request.user
        else:
            ticket.resolved_at = None
            ticket.resolved_by = None

        ticket.save(update_fields=[
            "status", "resolved_at", "resolved_by", "updated_at",
        ])

        return Response(MaintenanceTicketSerializer(ticket).data)

    @action(detail=True, methods=["post"], url_path="notes")
    def add_note(self, request, pk=None):
        ticket = self.get_object()
        serializer = MaintenanceTicketNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        note = serializer.validated_data["note"]
        timestamp = timezone.now().strftime("%Y-%m-%d %H:%M")
        entry = f"[{timestamp}] {request.user.username}: {note}"

        ticket.notes = f"{ticket.notes}\n{entry}" if ticket.notes else entry
        ticket.save(update_fields=["notes", "updated_at"])

        return Response(MaintenanceTicketSerializer(ticket).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        ticket = self.get_object()

        if ticket.status == MaintenanceTicket.Status.RESOLVED:
            return Response(
                {"detail": "Cannot cancel a resolved ticket."},
                status=status.HTTP_409_CONFLICT,
            )

        ticket.status = MaintenanceTicket.Status.CANCELLED
        ticket.save(update_fields=["status", "updated_at"])

        return Response(MaintenanceTicketSerializer(ticket).data)

    @action(detail=True, methods=["post"], url_path="assign")
    def assign(self, request, pk=None):
        ticket = self.get_object()
        user_id = request.data.get("user_id")

        if not user_id:
            return Response(
                {"detail": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from users.models import User

        try:
            assignee = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if getattr(assignee, "role", None) not in ("CARETAKER", "ESTATE_MANAGER"):
            return Response(
                {"detail": "Only caretakers or estate managers can be assigned."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket.assigned_to = assignee
        if ticket.status == MaintenanceTicket.Status.PENDING:
            ticket.status = MaintenanceTicket.Status.IN_PROGRESS
        ticket.save(update_fields=["assigned_to", "status", "updated_at"])

        return Response(MaintenanceTicketSerializer(ticket).data)