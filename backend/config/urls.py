from django.contrib import admin
from django.urls import path, include
from payments.views import mpesa_callback

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/properties/', include('properties.urls')),
    path('api/leasing/', include('leasing.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/maintenance/', include('maintenance.urls')),
    path('api/payments/mpesa-callback/', mpesa_callback, name='mpesa_callback'),
]
