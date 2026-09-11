from django.contrib import admin

from .models import MaintenanceTicket


@admin.register(MaintenanceTicket)
class MaintenanceTicketAdmin(admin.ModelAdmin):
    list_display = (
        "id", "title", "tenant", "estate", "house",
        "priority", "status", "assigned_to", "created_at",
    )
    list_filter = ("status", "priority", "category")
    search_fields = ("title", "description", "tenant__username", "house__house_number")
    autocomplete_fields = ("tenant", "estate", "house", "room", "assigned_to", "resolved_by")
    readonly_fields = ("resolved_at", "resolved_by", "created_at", "updated_at")
    ordering = ("-created_at",)