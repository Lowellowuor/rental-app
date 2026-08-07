from django.db import models
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from properties.models import Room
from users.models import User

class LeaseAgreement(models.Model):
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='leases'
    )
    sub_tenant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='leases'
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    rent_due_day = models.IntegerField(choices=[(i, i) for i in range(1, 32)])
    late_fee_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=10.00
    )
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2)
    next_invoice_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[('active', 'Active'), ('terminated', 'Terminated')],
        default='active'
    )

    def save(self, *args, **kwargs):
        if not self.pk:
            start = self.start_date
            target_day = self.rent_due_day

            if start.day > target_day:
                self.next_invoice_date = start.replace(day=target_day) + relativedelta(months=1)
            else:
                self.next_invoice_date = start.replace(day=target_day)

        super().save(*args, **kwargs)

    def generate_next_invoice_date(self):
        return self.next_invoice_date + relativedelta(months=1)

    def __str__(self):
        return f"{self.room} - {self.sub_tenant.username}"

class Invoice(models.Model):
    lease = models.ForeignKey(
        LeaseAgreement,
        on_delete=models.CASCADE,
        related_name='invoices'
    )
    period_start = models.DateField()
    period_end = models.DateField()
    due_date = models.DateField()
    base_rent = models.DecimalField(max_digits=10, decimal_places=2)
    utility_bills_split = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    late_fee_charged = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    balance_due = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('paid', 'Paid'), ('overdue', 'Overdue')],
        default='pending'
    )
    pdf_file = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"Invoice #{self.id} - {self.lease.sub_tenant.username}"

    def calculate_total(self):
        return self.base_rent + self.utility_bills_split + self.late_fee_charged
