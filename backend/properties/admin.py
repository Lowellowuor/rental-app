from django.contrib import admin

from .models import Estate, House, Room


@admin.register(Estate)
class EstateAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "location", "total_units", "landlord", "manager", "caretaker")
    list_filter = ("location",)
    search_fields = ("name", "location")
    autocomplete_fields = ("landlord", "manager", "caretaker")
    ordering = ("name",)


@admin.register(House)
class HouseAdmin(admin.ModelAdmin):
    list_display = ("id", "house_number", "estate", "main_tenant", "room_count")
    list_filter = ("estate",)
    search_fields = ("house_number", "estate__name")
    autocomplete_fields = ("estate", "main_tenant")

    def room_count(self, obj):
        return obj.rooms.count()
    room_count.short_description = "Rooms"


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("id", "room_name", "house", "is_occupied", "main_tenant")
    list_filter = ("is_occupied", "house__estate")
    search_fields = ("room_name", "house__house_number")
    autocomplete_fields = ("house", "main_tenant")