from django.conf import settings
from django.db import models


class MaintenanceTicket(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in-progress", "In Progress"
        RESOLVED = "resolved", "Resolved"
        CANCELLED = "cancelled", "Cancelled"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    class Category(models.TextChoices):
        PLUMBING = "plumbing", "Plumbing"
        ELECTRICAL = "electrical", "Electrical"
        STRUCTURAL = "structural", "Structural"
        APPLIANCE = "appliance", "Appliance"
        PEST = "pest", "Pest Control"
        SECURITY = "security", "Security"
        CLEANING = "cleaning", "Cleaning"
        OTHER = "other", "Other"

    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="maintenance_tickets",
    )
    estate = models.ForeignKey(
        "properties.Estate",
        on_delete=models.CASCADE,
        related_name="maintenance_tickets",
        null=True,
        blank=True,
    )
    house = models.ForeignKey(
        "properties.House",
        on_delete=models.CASCADE,
        related_name="maintenance_tickets",
        null=True,
        blank=True,
    )
    room = models.ForeignKey(
        "properties.Room",
        on_delete=models.SET_NULL,
        related_name="maintenance_tickets",
        null=True,
        blank=True,
    )

    title = models.CharField(max_length=120, default="")
    description = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets",
        limit_choices_to={"role__in": ["CARETAKER", "ESTATE_MANAGER"]},
    )

    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_tickets",
    )

    notes = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "priority"]),
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["estate", "status"]),
            models.Index(fields=["assigned_to", "status"]),
        ]

    def __str__(self):
        return f"#{self.pk} · {self.tenant_id} · {self.title or self.description[:30]}"

    @property
    def is_resolved(self):
        return self.status == self.Status.RESOLVED

    @property
    def is_open(self):
        return self.status in (self.Status.PENDING, self.Status.IN_PROGRESS)