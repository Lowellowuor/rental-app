from django.contrib import admin

from .models import MPESATransaction


@admin.register(MPESATransaction)
class MPESATransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id", "tenant", "amount", "phone_number",
        "status", "mpesa_receipt_number", "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("tenant__username", "phone_number", "checkout_request_id", "mpesa_receipt_number")
    autocomplete_fields = ("tenant", "invoice")
    readonly_fields = (
        "merchant_request_id", "checkout_request_id",
        "mpesa_receipt_number", "paid_at",
        "created_at", "updated_at",
    )
    ordering = ("-created_at",)