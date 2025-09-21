import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    log: any;
    fees: number;
    fees_split: any;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: any;
    };
  };
}

@Injectable()
export class PaystackService {
  private readonly secretKey: string|undefined;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(
    private config: ConfigService,
  ) {
    this.secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!this.secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is required');
    }
  }

  /**
   * Initialize a payment with Paystack
   */
  async initializePayment(params: {
    email: string;
    amount: number; // In kobo (NGN lowest unit)
    currency?: string;
    reference?: string;
    callback_url?: string;
    metadata?: any;
    channels?: string[];
    sellerSubaccount?: string; 
  }): Promise<PaystackInitializeResponse> {
    try {
      const payload = {
        email: params.email,
        amount: params.amount,
        currency: params.currency || 'GHS',
        reference: params.reference || this.generateReference(),
        callback_url: params.callback_url || `${this.config.get('FRONTEND_URL')}/payments/callback`,
        metadata: params.metadata || {},
        channels: params.channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      };
      
      const response = await this.makeRequest('/transaction/initialize', 'POST', payload);
      return response;
    } catch (error) {
      throw new InternalServerErrorException(`Payment initialization failed: ${error.message}`);
    }
  }

  /**
   * Verify a payment with Paystack
   */
  async verifyPayment(reference: string) {
    console.log("Transaction reference : ",reference)
    try {
      const response = await this.makeRequest(`/transaction/verify/${reference}`, 'GET');
      return response;
    } catch (error) {
      throw new BadRequestException(`Payment verification failed: ${error.message}`);
    }
  }


  async verifyTransfer(reference: string) {
  try {
    const response = await fetch(`${this.baseUrl}/transfer/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Verification failed: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();

    return {
      success: result.status === true,
      data: result.data,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
  /**
   * Create or update Paystack customer
   */
  async createCustomer(params: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    metadata?: any;
  }) {
    try {
      const payload = {
        email: params.email,
        first_name: params.first_name || '',
        last_name: params.last_name || '',
        phone: params.phone || '',
        metadata: params.metadata || {},
      };
      
      const response = await this.makeRequest('/customer', 'POST', payload);
    
      return response;
    } catch (error) {
      // Customer might already exist, try to fetch instead
      return this.getCustomer(params.email);
    }
  }

async createRecipient(user: { 
  name: string; 
  email: string; 
  phone: string; 
  bankAccountNumber: string; 
  bankCode: string 
}): Promise<string> {
  try {
    const response = await fetch(`${this.baseUrl}/transferrecipient`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: "nuban", // Nigerian bank account
        name: user.name,
        account_number: user.bankAccountNumber,
        bank_code: user.bankCode,
        currency: "NGN",
        email: user.email,
        phone: user.phone,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create recipient: ${errorData.message}`);
    }

    const result = await response.json();
    return result.data.recipient_code; // ← e.g., "RCP_123456789"
  } catch (error) {
    console.error('Paystack createRecipient error:', error);
    throw error;
  }
}
async initiateTransfer(dto: {
  amount: number;
  recipient: string; // email or recipient code
  reason: string;
  reference: string;
}) {
  try {
    // If recipient is an email, you may want to resolve it to a recipient code
    // For now, assume recipient is a Paystack recipient code
    let recipientCode = dto.recipient;

    // Optional: If you store recipient codes in DB, fetch here
    // Example:
    // const user = await this.prisma.user.findUnique({ where: { email: dto.recipient } });
    // if (user?.paystackRecipientCode) {
    //   recipientCode = user.paystackRecipientCode;
    // } else {
    //   throw new Error('No Paystack recipient code found for user');
    // }

    const response = await fetch(`${this.baseUrl}/transfer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: "balance",
        amount: dto.amount * 100, // Paystack uses kobo (smallest currency unit)
        recipient: recipientCode,
        reason: dto.reason,
        reference: dto.reference,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Paystack API Error: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();

    if (result.status !== true) {
      throw new Error(`Paystack Transfer Failed: ${result.message}`);
    }

    return {
      success: true,
      data: result.data, // Paystack returns transfer object under `data`
      message: 'Transfer initiated successfully',
    };

  } catch (error) {
    console.error('Paystack initiateTransfer error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
  /**
   * Get customer by email
   */
  async getCustomer(email: string) {
    try {
      const response = await this.makeRequest(`/customer/${email}`, 'GET');
      return response;
    } catch (error) {
      throw new BadRequestException(`Customer lookup failed: ${error.message}`);
    }
  }

  /**
   * Initiate a refund
   */
  async createRefund(params: {
    transaction: string | number; // Transaction reference or ID
    amount?: number; // Amount in kobo, optional (full refund if not provided)
    currency?: string;
    customer_note?: string;
    merchant_note?: string;
  }) {
    try {
      const payload = {
        transaction: params.transaction,
        amount: params.amount,
        currency: params.currency || 'NGN',
        customer_note: params.customer_note || 'Refund processed',
        merchant_note: params.merchant_note || 'Refund initiated by system',
      };

      const response = await this.makeRequest('/refund', 'POST', payload);
      return response;
    } catch (error) {
      throw new InternalServerErrorException(`Refund creation failed: ${error.message}`);
    }
  }

  /**
   * List transactions with optional filters
   */
  async listTransactions(params?: {
    perPage?: number;
    page?: number;
    customer?: number;
    status?: string;
    from?: string;
    to?: string;
    amount?: number;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `/transaction${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.makeRequest(url, 'GET');
      return response;
    } catch (error) {
      throw new InternalServerErrorException(`Transaction listing failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const webhookSecret = this.config.get<string>('PAYSTACK_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('PAYSTACK_WEBHOOK_SECRET is required');
      }

      const hash = crypto
        .createHmac('sha512', webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');

      return hash === signature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate platform fee
   */
  calculatePlatformFee(amount: number): number {
    const feePercentage = parseFloat(this.config.get<string>('PLATFORM_FEE_PERCENTAGE') || '2.5');
    return Math.round((amount * feePercentage) / 100);
  }

  /**
   * Generate unique payment reference
   */
  generateReference(): string {
    return `TXN_${Date.now()}_${uuidv4().substring(0, 8).toUpperCase()}`;
  }

  /**
   * Convert amount from Naira to Kobo (Paystack uses kobo)
   */
  nairaToKobo(naira: number): number {
    return Math.round(naira * 100);
  }

  /**
   * Convert amount from Kobo to Naira
   */
  koboToNaira(kobo: number): number {
    return kobo / 100;
  }

  /**
   * Private method to make HTTP requests to Paystack API
   */
  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PropertyPlatform/1.0',
        },
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!result.status) {
        throw new Error(result.message || 'Paystack API returned unsuccessful status');
      }

      return result;
    } catch (error) {
      console.error('Paystack API Error:', error);
      throw error;
    }
  }

  /**
   * Health check - verify API connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('/transaction?perPage=1', 'GET');
      return true;
    } catch (error) {
      console.error('Paystack health check failed:', error);
      return false;
    }
  }
}