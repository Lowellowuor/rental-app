import json
from django.http import JsonResponse
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MPESATransaction
from .serializers import MPESATransactionSerializer
from .mpesa_service import MPESAService
from leasing.models import Invoice

class MPESATransactionViewSet(viewsets.ModelViewSet):
    queryset = MPESATransaction.objects.all().select_related('tenant', 'invoice')
    serializer_class = MPESATransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUB_TENANT':
            return self.queryset.filter(tenant=user)
        elif user.role == 'MAIN_TENANT':
            return self.queryset.filter(invoice__lease__room__house__main_tenant=user)
        return self.queryset
    
    @action(detail=False, methods=['post'])
    def initiate_payment(self, request):
        invoice_id = request.data.get('invoice_id')
        phone_number = request.data.get('phone_number')
        
        if not invoice_id or not phone_number:
            return Response(
                {'error': 'Invoice ID and phone number required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            invoice = Invoice.objects.get(id=invoice_id)
        except Invoice.DoesNotExist:
            return Response(
                {'error': 'Invoice not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if invoice.status == 'paid':
            return Response(
                {'error': 'Invoice already paid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Format phone number (remove leading 0, ensure 254 format)
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        elif phone_number.startswith('+254'):
            phone_number = phone_number[1:]
        elif not phone_number.startswith('254'):
            phone_number = '254' + phone_number
        
        # Generate a unique account reference
        account_reference = f'INV{invoice.id}'
        
        # Initialize M-PESA Service
        mpesa = MPESAService()
        
        try:
            response = mpesa.stk_push(
                phone_number=phone_number,
                amount=invoice.total_amount,
                account_reference=account_reference,
                transaction_desc=f'Rent Payment - {invoice.lease.room.house.house_number}'
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Save the transaction
        with transaction.atomic():
            mpesa_transaction = MPESATransaction.objects.create(
                invoice=invoice,
                tenant=request.user,
                amount=invoice.total_amount,
                phone_number=phone_number,
                merchant_request_id=response.get('MerchantRequestID'),
                checkout_request_id=response.get('CheckoutRequestID'),
                status='processing'
            )
        
        return Response({
            'transaction': MPESATransactionSerializer(mpesa_transaction).data,
            'mpesa_response': response
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def check_status(self, request, pk=None):
        transaction_obj = self.get_object()
        
        # Here you would query the M-PESA API to check transaction status
        # For now, return the current status
        return Response({
            'status': transaction_obj.status,
            'mpesa_receipt_number': transaction_obj.mpesa_receipt_number,
            'result_description': transaction_obj.result_description
        })
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse

@csrf_exempt
def mpesa_callback(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            result_code = data.get('Body', {}).get('stkCallback', {}).get('ResultCode')
            result_desc = data.get('Body', {}).get('stkCallback', {}).get('ResultDesc')
            checkout_request_id = data.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')
            mpesa_receipt_number = data.get('Body', {}).get('stkCallback', {}).get('CallbackMetadata', {}).get('Item', [{}])[1].get('Value') if data.get('Body', {}).get('stkCallback', {}).get('CallbackMetadata') else None
            
            # Find the transaction
            try:
                transaction = MPESATransaction.objects.get(checkout_request_id=checkout_request_id)
            except MPESATransaction.DoesNotExist:
                return JsonResponse({'ResultCode': 1, 'ResultDesc': 'Transaction not found'})
            
            if result_code == 0:  # Success
                transaction.status = 'success'
                transaction.mpesa_receipt_number = mpesa_receipt_number
                transaction.result_description = result_desc
                transaction.save()
                
                # Mark invoice as paid
                if transaction.invoice:
                    transaction.invoice.status = 'paid'
                    transaction.invoice.balance_due = 0
                    transaction.invoice.save()
            else:
                transaction.status = 'failed'
                transaction.result_description = result_desc
                transaction.save()
            
            return JsonResponse({'ResultCode': 0, 'ResultDesc': 'Success'})
        except Exception as e:
            return JsonResponse({'ResultCode': 1, 'ResultDesc': str(e)})
    
    return JsonResponse({'ResultCode': 1, 'ResultDesc': 'Invalid method'})
