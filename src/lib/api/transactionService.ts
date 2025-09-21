// src/lib/api/transactionService.ts
import { getAuthHeader } from '../auth/authservice';
import { BACKEND_BASE_URL } from '../constants/api';

const API_URL = BACKEND_BASE_URL;

interface ApiResponse<T> {
   T:any;
  message?: string;
}

export const transactionService = {
  getTransaction: async (id: number):Promise<{transaction:Transaction}> =>{
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch transaction');
    }

    const data = await response.json();
    return data;
  },

  getTransactionHistory: async (): Promise<ApiResponse<Transaction[]>> => {
    const response = await fetch(`${API_URL}/transactions/history`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch transaction history');
    }

    const data = await response.json();
    return data;
  },
};

// Types
// Add this interface at the top of your transactions/[id]/page.tsx
export interface Transaction {
  id: number;
  transactionId: string;
  amount: number;
  status: 'PENDING' | 'ESCROW' | 'PAYMENT_CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  buyerId: number;
  sellerId: number;
  propertyId: number;
  escrowAmount: number;
  escrowReleased: boolean;
  escrowReleasedById: number | null;
  escrowReleasedAt: string | null; // ISO date string
  paymentMethod: string | null;
  paymentReference: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  completedAt: string | null; // ISO date string
  
  // Relations
  buyer: {
    id: number;
    name: string;
    email: string;
  };
  
  seller: {
    id: number;
    name: string;
    email: string;
  };
  
  property: {
    id: number;
    title: string;
    location: string;
    images: string[];
  };
}
