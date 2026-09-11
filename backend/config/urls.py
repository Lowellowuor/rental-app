from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from payments.callbacks import mpesa_callback

api_v1_patterns = [
    path("auth/", include(("users.urls", "users"), namespace="users")),
    path("properties/", include(("properties.urls", "properties"), namespace="properties")),
    path("leasing/", include(("leasing.urls", "leasing"), namespace="leasing")),
    path("payments/", include(("payments.urls", "payments"), namespace="payments")),
    path("maintenance/", include(("maintenance.urls", "maintenance"), namespace="maintenance")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include((api_v1_patterns, "api"), namespace="v1")),
    path("api/mpesa/callback/", mpesa_callback, name="mpesa_callback"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)