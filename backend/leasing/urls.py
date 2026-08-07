from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeaseAgreementViewSet, InvoiceViewSet

router = DefaultRouter()
router.register(r'leases', LeaseAgreementViewSet)
router.register(r'invoices', InvoiceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
