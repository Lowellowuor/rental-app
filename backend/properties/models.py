from django.conf import settings
from django.db import models


class Estate(models.Model):
    name = models.CharField(max_length=120, db_index=True)
    location = models.CharField(max_length=200, db_index=True)
    total_units = models.PositiveIntegerField(default=0)

    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_estates",
        limit_choices_to={"role": "LANDLORD"},
    )
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_estates",
        limit_choices_to={"role": "ESTATE_MANAGER"},
    )
    caretaker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="caretaker_estates",
        limit_choices_to={"role": "CARETAKER"},
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_estates",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        permissions = [
            ("assign_manager_estate", "Can assign a manager to an estate"),
            ("assign_caretaker_estate", "Can assign a caretaker to an estate"),
            ("generate_units_estate", "Can generate units for an estate"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "location"],
                name="uniq_estate_name_per_location",
            ),
        ]
        indexes = [
            models.Index(fields=["location", "name"]),
            models.Index(fields=["landlord"]),
            models.Index(fields=["manager"]),
            models.Index(fields=["caretaker"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.location})"

    @property
    def house_count(self):
        return self.houses.count()

    @property
    def room_count(self):
        return Room.objects.filter(house__estate=self).count()

    @property
    def occupied_room_count(self):
        return Room.objects.filter(house__estate=self, is_occupied=True).count()


class House(models.Model):
    estate = models.ForeignKey(
        Estate,
        on_delete=models.CASCADE,
        related_name="houses",
    )
    house_number = models.CharField(max_length=40)
    main_tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rented_houses",
        limit_choices_to={"role__in": ["TENANT", "SUB_TENANT"]},
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["house_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["estate", "house_number"],
                name="uniq_house_number_per_estate",
            ),
        ]
        indexes = [
            models.Index(fields=["estate", "house_number"]),
            models.Index(fields=["main_tenant"]),
        ]

    def __str__(self):
        return f"{self.estate.name} - {self.house_number}"

    @property
    def room_count(self):
        return self.rooms.count()

    @property
    def occupied_room_count(self):
        return self.rooms.filter(is_occupied=True).count()


class Room(models.Model):
    house = models.ForeignKey(
        House,
        on_delete=models.CASCADE,
        related_name="rooms",
    )
    room_name = models.CharField(max_length=50)
    is_occupied = models.BooleanField(default=False)
    main_tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rented_rooms",
        limit_choices_to={"role__in": ["TENANT", "SUB_TENANT"]},
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["room_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["house", "room_name"],
                name="uniq_room_name_per_house",
            ),
        ]
        indexes = [
            models.Index(fields=["house", "is_occupied"]),
            models.Index(fields=["main_tenant"]),
        ]

    def __str__(self):
        return f"{self.house.house_number} - {self.room_name}"