from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import InvoiceViewSet, LeaseAgreementViewSet

app_name = "leasing"

router = DefaultRouter()
router.register(r"leases", LeaseAgreementViewSet, basename="lease")
router.register(r"invoices", InvoiceViewSet, basename="invoice")

urlpatterns = [
    path("", include(router.urls)),
]