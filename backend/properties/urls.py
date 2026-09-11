from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EstateViewSet, HouseViewSet, RoomViewSet

app_name = "properties"

router = DefaultRouter()
router.register(r"estates", EstateViewSet, basename="estate")
router.register(r"houses", HouseViewSet, basename="house")
router.register(r"rooms", RoomViewSet, basename="room")

urlpatterns = [
    path("", include(router.urls)),
]