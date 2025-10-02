// src/lib/api/transactionService.ts
import { authService, getAuthHeader } from '../auth/authservice';
import { BACKEND_BASE_URL } from '../constants/api';

const API_URL = BACKEND_BASE_URL;

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export const transactionService = {
  getTransaction: async (id: number): Promise<{ transaction: Transaction }> => {
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

  getTransactionHistory: async (): Promise<ApiResponse<TransactionHistory[]>> => {
    const response = await authService.authenticatedFetch(`${API_URL}/transactions/history`, {
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
  escrowReleasedAt: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  
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

export interface TransactionHistory {
  id: number;
  transactionId: string;
  amount: number;
  status: 'PENDING' | 'ESCROW' | 'PAYMENT_CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  buyerId: number;
  sellerId: number;
  propertyId: number;
  escrowAmount: number | null;
  escrowReleased: boolean;
  escrowReleasedById: number | null;
  escrowReleasedAt: Date | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  buyer: {
    id: number;
    email: string;
    name: string | null;
  };
  seller: {
    id: number;
    email: string;
    name: string | null;
  };
  property: {
    id: number;
    propertyId: string;
    title: string;
    location: string;
    images: string[];
  };
  escrowReleasedBy: {
    id: number;
    email: string;
    name: string | null;
  } | null;
}