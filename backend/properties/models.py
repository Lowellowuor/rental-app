from django.db import models
from users.models import User

class Estate(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    total_units = models.IntegerField(default=0)
    manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='managed_estates'
    )

    def __str__(self):
        return self.name

class House(models.Model):
    estate = models.ForeignKey(
        Estate,
        on_delete=models.CASCADE,
        related_name='houses'
    )
    house_number = models.CharField(max_length=20)
    main_tenant = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rented_houses'
    )

    def __str__(self):
        return f"{self.estate.name} - {self.house_number}"

class Room(models.Model):
    house = models.ForeignKey(
        House,
        on_delete=models.CASCADE,
        related_name='rooms'
    )
    room_name = models.CharField(max_length=50)
    is_occupied = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.house.house_number} - {self.room_name}"
