from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MPESATransactionViewSet

app_name = "payments"

router = DefaultRouter()
router.register(r"transactions", MPESATransactionViewSet, basename="transaction")

urlpatterns = [
    path("", include(router.urls)),
]