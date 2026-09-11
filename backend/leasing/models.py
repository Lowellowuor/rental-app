from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.db import models
from django.utils import timezone


class LeaseAgreement(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACTIVE = "active", "Active"
        EXPIRED = "expired", "Expired"
        TERMINATED = "terminated", "Terminated"

    room = models.ForeignKey(
        "properties.Room",
        on_delete=models.CASCADE,
        related_name="leases",
    )
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="leases",
        limit_choices_to={"role__in": ["TENANT", "SUB_TENANT"]},
    )
    is_lease_holder = models.BooleanField(
        default=True,
        help_text="True if this tenant is the primary lease holder for the room.",
    )

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    monthly_rent = models.DecimalField(max_digits=12, decimal_places=2)
    rent_due_day = models.PositiveSmallIntegerField()
    late_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    deposit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    next_invoice_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_leases",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "next_invoice_date"]),
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["room", "status"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(rent_due_day__gte=1) & models.Q(rent_due_day__lte=28),
                name="lease_rent_due_day_valid",
            ),
            models.CheckConstraint(
                check=models.Q(monthly_rent__gte=0),
                name="lease_rent_non_negative",
            ),
        ]

    def __str__(self):
        return f"{self.room} - {self.tenant_id}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.next_invoice_date:
            self.next_invoice_date = self._compute_first_invoice_date()
        super().save(*args, **kwargs)

    def _compute_first_invoice_date(self):
        target_day = min(self.rent_due_day, 28)
        start = self.start_date
        if start.day > target_day:
            return start.replace(day=target_day) + relativedelta(months=1)
        return start.replace(day=target_day)

    def advance_next_invoice_date(self):
        self.next_invoice_date = self.next_invoice_date + relativedelta(months=1)
        return self.next_invoice_date

    @property
    def house(self):
        return self.room.house

    @property
    def estate(self):
        return self.room.house.estate

    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE


class Invoice(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PARTIAL = "partial", "Partial"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"
        CANCELLED = "cancelled", "Cancelled"

    lease = models.ForeignKey(
        LeaseAgreement,
        on_delete=models.CASCADE,
        related_name="invoices",
    )

    period_start = models.DateField()
    period_end = models.DateField()
    due_date = models.DateField(db_index=True)

    base_rent = models.DecimalField(max_digits=12, decimal_places=2)
    utility_bills_split = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    late_fee_charged = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    pdf_file = models.URLField(blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_invoices",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-due_date", "-created_at"]
        indexes = [
            models.Index(fields=["status", "due_date"]),
            models.Index(fields=["lease", "status"]),
            models.Index(fields=["due_date"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["lease", "period_start"],
                name="uniq_invoice_per_lease_period",
            ),
            models.CheckConstraint(
                check=models.Q(total_amount__gte=0),
                name="invoice_total_non_negative",
            ),
            models.CheckConstraint(
                check=models.Q(balance_due__gte=0),
                name="invoice_balance_non_negative",
            ),
        ]

    def __str__(self):
        return f"Invoice #{self.pk} - {self.lease.room.house.house_number}"

    def save(self, *args, **kwargs):
        if not self.pk:
            self.total_amount = self.compute_total()
            if self.balance_due is None or self.balance_due == 0:
                self.balance_due = self.total_amount
        super().save(*args, **kwargs)

    def compute_total(self):
        return (
            (self.base_rent or 0)
            + (self.utility_bills_split or 0)
            + (self.other_charges or 0)
            + (self.late_fee_charged or 0)
        )

    def recalculate(self):
        self.total_amount = self.compute_total()
        self.balance_due = self.total_amount
        return self.total_amount

    def apply_payment(self, amount):
        from decimal import Decimal

        amount = Decimal(str(amount))
        self.balance_due = max(self.balance_due - amount, Decimal("0"))
        if self.balance_due == 0:
            self.status = self.Status.PAID
            self.paid_at = timezone.now()
        elif self.balance_due < self.total_amount:
            self.status = self.Status.PARTIAL
        self.save(update_fields=["balance_due", "status", "paid_at", "updated_at"])

    @property
    def reference(self):
        return f"INV{self.pk}"

    @property
    def tenant(self):
        return self.lease.tenant

    @property
    def estate(self):
        return self.lease.room.house.estate

    @property
    def is_paid(self):
        return self.status == self.Status.PAID