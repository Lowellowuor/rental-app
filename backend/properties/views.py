from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Estate, House, Room
from .serializers import EstateSerializer, HouseSerializer, RoomSerializer
from .permissions import IsEstateManagerOrReadOnly

class EstateViewSet(viewsets.ModelViewSet):
    queryset = Estate.objects.all().prefetch_related('houses__rooms')
    serializer_class = EstateSerializer
    permission_classes = [IsAuthenticated, IsEstateManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['manager']

class HouseViewSet(viewsets.ModelViewSet):
    queryset = House.objects.all().select_related('estate', 'main_tenant').prefetch_related('rooms')
    serializer_class = HouseSerializer
    permission_classes = [IsAuthenticated, IsEstateManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estate']

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().select_related('house').select_related('house__estate')
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated, IsEstateManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['house']
