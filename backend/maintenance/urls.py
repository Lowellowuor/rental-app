from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MaintenanceTicketViewSet

app_name = "maintenance"

router = DefaultRouter()
router.register(r"tickets", MaintenanceTicketViewSet, basename="ticket")

urlpatterns = [
    path("", include(router.urls)),
]