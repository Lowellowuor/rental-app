from django.db import models
from users.models import User
from leasing.models import Invoice

class MPESATransaction(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )
    
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mpesa_transactions'
    )
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mpesa_transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    phone_number = models.CharField(max_length=15)
    
    # M-PESA specific fields
    merchant_request_id = models.CharField(max_length=50, unique=True, db_index=True)
    checkout_request_id = models.CharField(max_length=50, blank=True, null=True)
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, null=True)
    result_code = models.IntegerField(default=0)
    result_description = models.TextField(blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.tenant.username} - {self.amount} - {self.status}"
