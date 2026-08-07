from django.contrib import admin
from .models import MaintenanceTicket

@admin.register(MaintenanceTicket)
class MaintenanceTicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'tenant', 'description', 'status', 'priority', 'created_at')
    list_filter = ('status', 'priority', 'created_at')
    search_fields = ('tenant__username', 'description')
    readonly_fields = ('created_at', 'updated_at')
