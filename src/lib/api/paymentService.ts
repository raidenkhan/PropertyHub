// src/lib/api/paymentService.ts
import { any } from 'zod';
import { getAuthHeader } from '../auth/authservice';
import { BACKEND_BASE_URL } from '../constants/api';
import { User } from '../auth/types';
import { Property } from './managerService';
import { metadata } from '@/app/layout';

const API_URL = BACKEND_BASE_URL;

type result=Transaction

interface ApiResponse<T> {
  status: string;
  message: string;
  data:result
}

export const paymentService = {
  // Step 1: Reserve property temporarily (doesn't change property status to UNDER_OFFER)
  reserveProperty: async (propertyId: number, amount: number) => {
    console.log("Reserving property for payment:", propertyId);
    const response = await fetch(`${API_URL}/transactions/reserve`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        propertyId, 
        offerAmount: amount,
        reservationTimeout: 15 * 60 * 1000 // 15 minutes reservation
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to reserve property');
    }
    const data = await response.json();
    console.log("Property reserved:", data);
    return data;
  },

  // Step 1 (Enhanced): Initiate transaction from accepted offer
  initiateTransactionFromOffer: async (offerId: string) => {
    console.log("Initiating transaction from accepted offer:", offerId);
    const response = await fetch(`${API_URL}/transactions/initiate-from-offer`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to initiate transaction from offer');
    }
    const data = await response.json();
    console.log("Transaction initiated from offer:", data);
    return data;
  },

  // Step 1 (Fallback): Initiate transaction (create record in DB) - for backward compatibility
  initiateTransaction: async (propertyId: string, amount: number) => {
    console.log("Initiating transaction for propertyId:", propertyId);
    const response = await fetch(`${API_URL}/transactions/initiate`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId, offerAmount: amount }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to initiate transaction');
    }
    const data = await response.json();
    console.log("Transaction initiated:", data);
    return data;
  },

  // Step 2: Initialize Paystack payment
  initializePayment: async (transactionId: number, callbackUrl?: string) => {
    const response = await fetch(`${API_URL}/payments/initialize`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:transactionId,
        callback_url: callbackUrl || `${window.location.origin}/payment/callback`,
        metadata:"PropertyHub Transaction"
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to initialize payment');
    }
    const data = await response.json();
    return data;
  },

  // Step 3: Verify payment after redirect
  verifyPayment: async (reference: string) => {
    console.log(reference)
    const response = await fetch(`${API_URL}/payments/verify`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to verify payment');
    }
    const data = await response.json();
    return data;
  },

  // Cancel payment and release property reservation
  cancelPayment: async (transactionId: number, reason: string = 'User cancelled') => {
    console.log("Cancelling payment for transaction:", transactionId);
    const response = await fetch(`${API_URL}/payments/cancel`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, reason }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to cancel payment');
    }
    const data = await response.json();
    console.log("Payment cancelled:", data);
    return data;
  },

  // Release property reservation (for cleanup)
  releaseReservation: async (propertyId: number, transactionId?: number) => {
    console.log("Releasing reservation for property:", propertyId);
    const response = await fetch(`${API_URL}/transactions/release-reservation`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId, transactionId }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to release reservation');
    }
    const data = await response.json();
    console.log("Reservation released:", data);
    return data;
  },

  // Get payment status
  getPaymentStatus: async (transactionId: number) => {
    const response = await fetch(`${API_URL}/payments/status/${transactionId}`, {
      method: 'GET',
      headers: { ...getAuthHeader() },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to get payment status');
    }
    const data = await response.json();
    return data;
  },
};

// Types
export interface Transaction {
  id: number,
  transactionId: string,
  amount: number,
  status: 'PENDING' | 'ESCROW' | 'PAYMENT_CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'//would check out
  buyerId: number,
  sellerId: number,
  propertyId: number,
  escrowAmount: number,
  escrowReleased: boolean,
  escrowReleasedById?: number,
  escrowReleasedAt?: string,
  paymentMethod?: string,
  paymentReference?: string,
  createdAt: string,
  updatedAt: string,
  completedAt?: string,
  buyer: User,
  seller: User,
  property:Property
}


export interface PaystackResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface VerificationResult {
  transaction: Transaction;
  payment_successful: boolean;
}