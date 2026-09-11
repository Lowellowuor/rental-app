import json
import logging

from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from leasing.models import Invoice

from .models import MPESATransaction

logger = logging.getLogger(__name__)


def _extract_callback_items(metadata):
    if not metadata:
        return {}
    return {
        item.get("Name"): item.get("Value")
        for item in metadata.get("Item", [])
        if isinstance(item, dict) and item.get("Name")
    }


@csrf_exempt
@require_POST
def mpesa_callback(request):
    try:
        payload = json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        logger.warning("mpesa_callback: invalid JSON body")
        return JsonResponse({"ResultCode": 0, "ResultDesc": "Ignored"})

    callback = payload.get("Body", {}).get("stkCallback", {})
    checkout_request_id = callback.get("CheckoutRequestID")
    result_code = callback.get("ResultCode")
    result_desc = callback.get("ResultDesc", "")

    if not checkout_request_id:
        logger.warning("mpesa_callback: missing CheckoutRequestID")
        return JsonResponse({"ResultCode": 0, "ResultDesc": "Ignored"})

    try:
        with transaction.atomic():
            txn = (
                MPESATransaction.objects
                .select_for_update()
                .select_related("invoice")
                .filter(checkout_request_id=checkout_request_id)
                .first()
            )

            if not txn:
                logger.warning(
                    "mpesa_callback: unknown CheckoutRequestID %s", checkout_request_id
                )
                return JsonResponse({"ResultCode": 0, "ResultDesc": "Ignored"})

            if txn.is_final:
                logger.info(
                    "mpesa_callback: already processed %s (%s)",
                    checkout_request_id, txn.status,
                )
                return JsonResponse({"ResultCode": 0, "ResultDesc": "Already processed"})

            if result_code == 0:
                items = _extract_callback_items(callback.get("CallbackMetadata", {}))
                receipt = items.get("MpesaReceiptNumber")
                paid_amount = items.get("Amount")

                txn.status = MPESATransaction.Status.SUCCESS
                txn.result_code = 0
                txn.result_description = result_desc
                txn.mpesa_receipt_number = receipt
                txn.paid_at = timezone.now()
                if paid_amount is not None:
                    txn.amount = paid_amount
                txn.save(update_fields=[
                    "status", "result_code", "result_description",
                    "mpesa_receipt_number", "paid_at", "amount", "updated_at",
                ])

                if txn.invoice_id:
                    invoice = Invoice.objects.select_for_update().get(pk=txn.invoice_id)
                    invoice.balance_due = max(invoice.balance_due - txn.amount, 0)
                    if invoice.balance_due == 0:
                        invoice.status = "paid"
                    invoice.save(update_fields=["balance_due", "status", "updated_at"])

                logger.info(
                    "mpesa_callback: success %s receipt=%s amount=%s",
                    checkout_request_id, receipt, paid_amount,
                )
            else:
                txn.status = MPESATransaction.Status.FAILED
                txn.result_code = result_code
                txn.result_description = result_desc
                txn.save(update_fields=[
                    "status", "result_code", "result_description", "updated_at",
                ])

                logger.info(
                    "mpesa_callback: failed %s code=%s desc=%s",
                    checkout_request_id, result_code, result_desc,
                )

    except Exception:
        logger.exception("mpesa_callback: unhandled error for %s", checkout_request_id)

    return JsonResponse({"ResultCode": 0, "ResultDesc": "Success"})