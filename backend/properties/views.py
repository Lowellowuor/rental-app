from django.db.models import Count, Prefetch, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle

from .models import Estate, House, Room
from .permissions import (
    CanManageHouse,
    CanManageRoom,
    CanViewProperty,
    IsEstateManagerOrReadOnly,
)
from .serializers import (
    EstateCreateSerializer,
    EstateDetailSerializer,
    EstateListSerializer,
    HouseSerializer,
    RoomSerializer,
)


class EstateCreateThrottle(UserRateThrottle):
    scope = "estate_create"


class EstateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsEstateManagerOrReadOnly]
    throttle_classes = [EstateCreateThrottle]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["manager", "landlord", "location"]
    search_fields = ["name", "location"]
    ordering_fields = ["name", "location", "created_at", "total_units"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)

        qs = (
            Estate.objects
            .select_related("manager", "landlord", "caretaker", "created_by")
            .annotate(house_count=Count("houses", distinct=True))
            .prefetch_related(
                Prefetch("houses", queryset=House.objects.select_related("main_tenant"))
            )
        )

        if role == "ADMIN" or role == "ACCOUNTANT":
            return qs

        if role == "LANDLORD":
            return qs.filter(landlord=user)

        if role == "ESTATE_MANAGER":
            return qs.filter(manager=user)

        if role == "CARETAKER":
            return qs.filter(caretaker=user)

        if role == "AGENT":
            return qs

        if role in ("TENANT", "SUB_TENANT"):
            return qs.filter(
                Q(houses__main_tenant=user)
                | Q(houses__rooms__main_tenant=user)
            ).distinct()

        return qs.none()

    def get_serializer_class(self):
        if self.action == "create":
            return EstateCreateSerializer
        if self.action == "retrieve":
            return EstateDetailSerializer
        return EstateListSerializer

    def get_throttles(self):
        if self.action == "create":
            return [EstateCreateThrottle()]
        return super().get_throttles()


class HouseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CanManageHouse]
    serializer_class = HouseSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["estate", "main_tenant"]
    search_fields = ["house_number", "estate__name"]
    ordering_fields = ["house_number", "created_at"]
    ordering = ["house_number"]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)

        qs = (
            House.objects
            .select_related("estate", "estate__manager", "estate__landlord", "estate__caretaker", "main_tenant")
            .prefetch_related(Prefetch("rooms", queryset=Room.objects.order_by("room_name")))
        )

        if role in ("ADMIN", "ACCOUNTANT", "AGENT"):
            return qs

        if role == "LANDLORD":
            return qs.filter(estate__landlord=user)

        if role == "ESTATE_MANAGER":
            return qs.filter(estate__manager=user)

        if role == "CARETAKER":
            return qs.filter(estate__caretaker=user)

        if role in ("TENANT", "SUB_TENANT"):
            return qs.filter(
                Q(main_tenant=user) | Q(rooms__main_tenant=user)
            ).distinct()

        return qs.none()


class RoomViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CanManageRoom]
    serializer_class = RoomSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["house", "is_occupied", "main_tenant"]
    search_fields = ["room_name", "house__house_number", "house__estate__name"]
    ordering_fields = ["room_name", "created_at"]
    ordering = ["room_name"]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)

        qs = Room.objects.select_related(
            "house",
            "house__estate",
            "house__estate__manager",
            "house__estate__landlord",
            "house__estate__caretaker",
            "main_tenant",
        )

        if role in ("ADMIN", "ACCOUNTANT", "AGENT"):
            return qs

        if role == "LANDLORD":
            return qs.filter(house__estate__landlord=user)

        if role == "ESTATE_MANAGER":
            return qs.filter(house__estate__manager=user)

        if role == "CARETAKER":
            return qs.filter(house__estate__caretaker=user)

        if role in ("TENANT", "SUB_TENANT"):
            return qs.filter(
                Q(main_tenant=user) | Q(house__main_tenant=user)
            ).distinct()

        return qs.none()