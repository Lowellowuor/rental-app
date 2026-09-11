from django.contrib import admin

from .models import Invoice, LeaseAgreement


@admin.register(LeaseAgreement)
class LeaseAgreementAdmin(admin.ModelAdmin):
    list_display = (
        "id", "room", "tenant", "monthly_rent",
        "rent_due_day", "status", "next_invoice_date",
    )
    list_filter = ("status", "is_lease_holder")
    search_fields = ("room__room_name", "tenant__username", "tenant__phone_number")
    autocomplete_fields = ("room", "tenant", "created_by")
    readonly_fields = ("next_invoice_date", "created_at", "updated_at")
    ordering = ("-id",)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        "id", "reference_display", "lease", "period_start", "period_end",
        "due_date", "total_amount", "balance_due", "status",
    )
    list_filter = ("status", "due_date")
    search_fields = ("lease__tenant__username", "lease__room__house__house_number")
    autocomplete_fields = ("lease", "created_by")
    readonly_fields = ("created_at", "updated_at", "paid_at")
    ordering = ("-due_date",)

    def reference_display(self, obj):
        return f"INV{obj.pk}"
    reference_display.short_description = "Reference"