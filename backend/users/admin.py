from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "phone_number", "is_verified", "is_active")
    list_filter = ("role", "is_verified", "is_staff", "is_active")
    search_fields = ("username", "email", "phone_number", "national_id")
    ordering = ("username",)

    fieldsets = BaseUserAdmin.fieldsets + (
        ("Kenya Profile", {
            "fields": (
                "role",
                "phone_number",
                "alternate_phone",
                "national_id",
                "id_type",
                "kra_pin",
                "date_of_birth",
                "profile_pic",
                "emergency_contact_name",
                "emergency_contact_phone",
                "is_verified",
                "fcm_token",
            ),
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Profile", {
            "fields": ("role", "phone_number", "email"),
        }),
    )