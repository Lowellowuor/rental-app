from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MPESATransactionViewSet

router = DefaultRouter()
router.register(r'transactions', MPESATransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
