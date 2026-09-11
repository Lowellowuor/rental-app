from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        LANDLORD = "LANDLORD", "Landlord"
        ESTATE_MANAGER = "ESTATE_MANAGER", "Estate Manager"
        CARETAKER = "CARETAKER", "Caretaker"
        AGENT = "AGENT", "Agent"
        ACCOUNTANT = "ACCOUNTANT", "Accountant"
        TENANT = "TENANT", "Tenant"
        SUB_TENANT = "SUB_TENANT", "Sub-Tenant"

    class IdType(models.TextChoices):
        NATIONAL_ID = "NATIONAL_ID", "National ID"
        PASSPORT = "PASSPORT", "Passport"
        DRIVER_LICENSE = "DRIVER_LICENSE", "Driver's License"
        ALIEN_ID = "ALIEN_ID", "Alien ID"

    role = models.CharField(
        max_length=32,
        choices=Role.choices,
        default=Role.SUB_TENANT,
        db_index=True,
    )

    phone_number = models.CharField(max_length=15, unique=True, db_index=True)
    alternate_phone = models.CharField(max_length=15, blank=True, default="")

    national_id = models.CharField(max_length=20, blank=True, default="", db_index=True)
    id_type = models.CharField(
        max_length=20,
        choices=IdType.choices,
        default=IdType.NATIONAL_ID,
        blank=True,
    )
    kra_pin = models.CharField(max_length=11, blank=True, default="")

    profile_pic = models.URLField(blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)

    emergency_contact_name = models.CharField(max_length=100, blank=True, default="")
    emergency_contact_phone = models.CharField(max_length=15, blank=True, default="")

    fcm_token = models.TextField(blank=True, null=True)

    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["phone_number"]

    class Meta:
        ordering = ["username"]
        indexes = [
            models.Index(fields=["role", "is_active"]),
            models.Index(fields=["phone_number"]),
            models.Index(fields=["national_id"]),
        ]

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_landlord(self):
        return self.role == self.Role.LANDLORD

    @property
    def is_estate_manager(self):
        return self.role == self.Role.ESTATE_MANAGER

    @property
    def is_caretaker(self):
        return self.role == self.Role.CARETAKER

    @property
    def is_agent(self):
        return self.role == self.Role.AGENT

    @property
    def is_accountant(self):
        return self.role == self.Role.ACCOUNTANT

    @property
    def is_tenant(self):
        return self.role == self.Role.TENANT

    @property
    def is_sub_tenant(self):
        return self.role == self.Role.SUB_TENANT

    @property
    def can_manage_properties(self):
        return self.role in (self.Role.ADMIN, self.Role.LANDLORD, self.Role.ESTATE_MANAGER)

    @property
    def can_view_finances(self):
        return self.role in (
            self.Role.ADMIN,
            self.Role.LANDLORD,
            self.Role.ESTATE_MANAGER,
            self.Role.ACCOUNTANT,
        )

    @property
    def can_pay(self):
        return self.role in (self.Role.TENANT, self.Role.SUB_TENANT)

    @property
    def can_log_maintenance(self):
        return self.role in (
            self.Role.ADMIN,
            self.Role.LANDLORD,
            self.Role.ESTATE_MANAGER,
            self.Role.CARETAKER,
            self.Role.TENANT,
            self.Role.SUB_TENANT,
        )