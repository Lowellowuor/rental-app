import requests
import base64
import json
from datetime import datetime
from django.conf import settings
from decouple import config

class MPESAService:
    def __init__(self):
        self.consumer_key = config('MPESA_CONSUMER_KEY')
        self.consumer_secret = config('MPESA_CONSUMER_SECRET')
        self.passkey = config('MPESA_PASSKEY')
        self.shortcode = config('MPESA_SHORTCODE', default='174379')
        self.environment = config('MPESA_ENVIRONMENT', default='sandbox')
        
        if self.environment == 'sandbox':
            self.base_url = 'https://sandbox.safaricom.co.ke'
        else:
            self.base_url = 'https://api.safaricom.co.ke'
    
    def get_access_token(self):
        url = f'{self.base_url}/oauth/v1/generate?grant_type=client_credentials'
        response = requests.get(
            url,
            auth=(self.consumer_key, self.consumer_secret)
        )
        if response.status_code == 200:
            return response.json().get('access_token')
        return None
    
    def stk_push(self, phone_number, amount, account_reference, transaction_desc):
        access_token = self.get_access_token()
        if not access_token:
            raise Exception('Failed to get access token')
        
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode(
            f'{self.shortcode}{self.passkey}{timestamp}'.encode()
        ).decode()
        
        callback_url = config('MPESA_CALLBACK_URL')
        
        payload = {
            'BusinessShortCode': self.shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': int(amount),
            'PartyA': phone_number,
            'PartyB': self.shortcode,
            'PhoneNumber': phone_number,
            'CallBackURL': callback_url,
            'AccountReference': account_reference,
            'TransactionDesc': transaction_desc
        }
        
        url = f'{self.base_url}/mpesa/stkpush/v1/processrequest'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(url, json=payload, headers=headers)
        return response.json()
