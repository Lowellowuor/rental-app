from django.db import models
from users.models import User
from properties.models import House

class MaintenanceTicket(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in-progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('cancelled', 'Cancelled'),
    )
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='maintenance_tickets')
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name='maintenance_tickets', null=True, blank=True)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.tenant.username} - {self.description[:30]}"
