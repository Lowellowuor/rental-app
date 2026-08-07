from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EstateViewSet, HouseViewSet, RoomViewSet

router = DefaultRouter()
router.register(r'estates', EstateViewSet)
router.register(r'houses', HouseViewSet)
router.register(r'rooms', RoomViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
