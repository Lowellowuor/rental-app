from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from .models import MPESATransaction


@shared_task
def cleanup_stale_transactions():
    cutoff = timezone.now() - timedelta(hours=3)
    updated = MPESATransaction.objects.filter(
        status=MPESATransaction.Status.PROCESSING,
        created_at__lt=cutoff,
    ).update(
        status=MPESATransaction.Status.FAILED,
        result_description="Timed out — no callback received.",
    )
    return f"Marked {updated} stale transactions as failed."