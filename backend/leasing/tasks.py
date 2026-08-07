from celery import shared_task
from datetime import date
from django.db import transaction
from .models import LeaseAgreement, Invoice
from dateutil.relativedelta import relativedelta

@shared_task
def generate_daily_invoices():
    today = date.today()
    due_leases = LeaseAgreement.objects.filter(
        status='active',
        next_invoice_date=today
    )
    
    count = 0
    for lease in due_leases:
        with transaction.atomic():
            if Invoice.objects.filter(lease=lease, due_date=today).exists():
                continue
            
            period_start = today
            period_end = today + relativedelta(months=1) - relativedelta(days=1)
            
            Invoice.objects.create(
                lease=lease,
                period_start=period_start,
                period_end=period_end,
                due_date=today,
                base_rent=lease.monthly_rent,
                utility_bills_split=0,
                late_fee_charged=0,
                total_amount=lease.monthly_rent,
                balance_due=lease.monthly_rent,
                status='pending'
            )
            
            lease.next_invoice_date = lease.generate_next_invoice_date()
            lease.save()
            count += 1
    
    return f"Generated {count} invoice(s) for {today}"
