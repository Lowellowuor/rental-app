from django.conf import settings
from django.db import models


class MPESATransaction(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    invoice = models.ForeignKey(
        "leasing.Invoice",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mpesa_transactions",
    )
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mpesa_transactions",
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    phone_number = models.CharField(max_length=15)

    merchant_request_id = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        unique=True,
        db_index=True,
    )
    checkout_request_id = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        unique=True,
        db_index=True,
    )
    mpesa_receipt_number = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        db_index=True,
    )

    result_code = models.IntegerField(null=True, blank=True)
    result_description = models.TextField(blank=True, default="")

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["invoice", "status"]),
            models.Index(fields=["phone_number"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(amount__gte=0),
                name="mpesa_amount_non_negative",
            ),
        ]

    def __str__(self):
        return f"{self.tenant_id} · {self.amount} · {self.status}"

    @property
    def is_final(self):
        return self.status in (self.Status.SUCCESS, self.Status.FAILED, self.Status.CANCELLED)

    @property
    def is_successful(self):
        return self.status == self.Status.SUCCESS