interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  businessShortCode: string;
  passkey: string;
  callbackUrl: string;
  environment: 'sandbox' | 'production';
}

interface StkPushRequest {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  TransactionType: string;
  Amount: number;
  PartyA: string;
  PartyB: string;
  PhoneNumber: string;
  CallBackURL: string;
  AccountReference: string;
  TransactionDesc: string;
}

interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface MpesaCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

export class MpesaService {
  private config: MpesaConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY || '',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
      businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE || '',
      passkey: process.env.MPESA_PASSKEY || '',
      callbackUrl: process.env.MPESA_CALLBACK_URL || '',
      environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };
  }

  private getBaseUrl(): string {
    return this.config.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
    
    const response = await fetch(`${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get M-Pesa access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    
    // Token expires in 1 hour, set expiry to 55 minutes from now
    this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
    
    return this.accessToken!;
  }

  private generatePassword(): { password: string; timestamp: string } {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${this.config.businessShortCode}${this.config.passkey}${timestamp}`
    ).toString('base64');
    
    return { password, timestamp };
  }

  async initiateStkPush(phoneNumber: string, amount: number, accountReference: string): Promise<StkPushResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();
      
      // Format phone number to international format
      const formattedPhone = phoneNumber.startsWith('254') 
        ? phoneNumber 
        : phoneNumber.replace(/^0/, '254');

      const stkPushData: StkPushRequest = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: this.config.businessShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: 'http://209.74.86.231:8000/api/mpesa/callback',
        AccountReference: accountReference,
        TransactionDesc: `Payment for ${accountReference}`,
      };

      const response = await fetch(`${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stkPushData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`M-Pesa STK Push failed: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('M-Pesa STK Push error:', error);
      throw error;
    }
  }

  async queryStkStatus(checkoutRequestId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      const queryData = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await fetch(`${this.getBaseUrl()}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryData),
      });

      if (!response.ok) {
        throw new Error('Failed to query STK status');
      }

      return await response.json();
    } catch (error) {
      console.error('M-Pesa STK query error:', error);
      throw error;
    }
  }

  parseCallbackData(callbackData: MpesaCallbackData): {
    success: boolean;
    mpesaReceiptNumber?: string;
    phoneNumber?: string;
    amount?: number;
    transactionDate?: Date;
    error?: string;
  } {
    const { stkCallback } = callbackData.Body;
    
    if (stkCallback.ResultCode !== 0) {
      return {
        success: false,
        error: stkCallback.ResultDesc,
      };
    }

    if (!stkCallback.CallbackMetadata) {
      return {
        success: false,
        error: 'No callback metadata received',
      };
    }

    const metadata = stkCallback.CallbackMetadata.Item;
    const getMetadataValue = (name: string) => {
      const item = metadata.find(item => item.Name === name);
      return item ? item.Value : null;
    };

    return {
      success: true,
      mpesaReceiptNumber: getMetadataValue('MpesaReceiptNumber') as string,
      phoneNumber: getMetadataValue('PhoneNumber') as string,
      amount: getMetadataValue('Amount') as number,
      transactionDate: new Date(getMetadataValue('TransactionDate') as string),
    };
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('254')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '254' + cleaned.slice(1);
    } else if (cleaned.length === 9) {
      return '254' + cleaned;
    }
    
    throw new Error('Invalid phone number format');
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    try {
      const formatted = this.formatPhoneNumber(phoneNumber);
      return /^254[17]\d{8}$/.test(formatted);
    } catch {
      return false;
    }
  }
}

export const mpesaService = new MpesaService();
