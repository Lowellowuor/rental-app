from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from users.models import User
from properties.models import Estate, House, Room
from leasing.models import LeaseAgreement, Invoice
from payments.models import MPESATransaction

# Custom User Admin
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'phone_number', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('phone_number', 'role', 'kra_pin', 'profile_pic', 'fcm_token')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('phone_number', 'role', 'kra_pin')}),
    )

admin.site.register(User, CustomUserAdmin)

# Estate Admin
@admin.register(Estate)
class EstateAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'location', 'total_units', 'manager')
    list_filter = ('manager',)
    search_fields = ('name', 'location')
    ordering = ('name',)

# House Admin
@admin.register(House)
class HouseAdmin(admin.ModelAdmin):
    list_display = ('id', 'house_number', 'estate', 'main_tenant')
    list_filter = ('estate', 'main_tenant')
    search_fields = ('house_number',)

# Room Admin
@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'room_name', 'house', 'is_occupied')
    list_filter = ('house', 'is_occupied')
    search_fields = ('room_name',)

# Lease Agreement Admin
@admin.register(LeaseAgreement)
class LeaseAgreementAdmin(admin.ModelAdmin):
    list_display = ('id', 'room', 'sub_tenant', 'monthly_rent', 'rent_due_day', 'status', 'next_invoice_date')
    list_filter = ('status', 'rent_due_day')
    search_fields = ('room__room_name', 'sub_tenant__username')
    readonly_fields = ('next_invoice_date',)
    ordering = ('-id',)

# Invoice Admin
@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'lease', 'period_start', 'period_end', 'due_date', 'total_amount', 'status')
    list_filter = ('status', 'due_date')
    search_fields = ('lease__sub_tenant__username',)
    ordering = ('-due_date',)

# M-PESA Transaction Admin
@admin.register(MPESATransaction)
class MPESATransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'tenant', 'amount', 'phone_number', 'status', 'mpesa_receipt_number', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('tenant__username', 'phone_number', 'merchant_request_id')
    readonly_fields = ('merchant_request_id', 'checkout_request_id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
