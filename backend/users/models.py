from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('SUPER_ADMIN', 'Super Admin'),
        ('ESTATE_MANAGER', 'Estate Manager'),
        ('MAIN_TENANT', 'Main Tenant'),
        ('SUB_TENANT', 'Sub-Tenant'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='SUB_TENANT')
    phone_number = models.CharField(max_length=15, unique=True)
    kra_pin = models.CharField(max_length=11, blank=True, null=True)
    profile_pic = models.URLField(blank=True, null=True)
    fcm_token = models.TextField(blank=True, null=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['phone_number']
