// src/lib/api/managerService.ts
import { authService, getAuthHeader } from '../auth/authservice';
import { BACKEND_BASE_URL } from '../constants/api';

const API_URL = BACKEND_BASE_URL

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const managerService = {
  // === PROPERTY VERIFIER ===
  getPendingProperties: async (): Promise<ApiResponse<Property[]>> => {
    const response = await authService.authenticatedFetch(`${API_URL}/manager/properties/pending`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch pending properties: ${response.statusText}`);
    }
    const data = await response.json();
    return { data };
  },

  approveProperty: async (propertyId: number, notes?: string): Promise<ApiResponse<Property>> => {
    const response = await authService.authenticatedFetch(`${API_URL}/manager/properties/${propertyId}/approve`, {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to approve property');
    }
    const data = await response.json();
    return { data };
  },

  rejectProperty: async (propertyId: number, reason: string): Promise<ApiResponse<Property>> => {
    const response = await authService.authenticatedFetch(`${API_URL}/manager/properties/${propertyId}/reject`, {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to reject property');
    }
    const data = await response.json();
    return { data };
  },

  suspendProperty: async (propertyId: number, reason: string): Promise<ApiResponse<Property>> => {
    const response = await authService.authenticatedFetch(`${API_URL}/manager/properties/${propertyId}/suspend`, {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to suspend property');
    }
    const data = await response.json();
    return { data };
  },

  // === ESCROW MANAGER ===
  getEscrowTransactions: async (): Promise<ApiResponse<Transaction[]>> => {
    const response = await authService.authenticatedFetch(`${API_URL}/manager/transactions/escrow`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch escrow transactions');
    }
    const data = await response.json();
    return { data };
  },

  releaseEscrow: async (transactionId: number, note?: string): Promise<ApiResponse<Transaction>> => {
    const response = await authService.authenticatedFetch(`${API_URL}/manager/transactions/${transactionId}/release-escrow`, {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to release escrow');
    }
    const data = await response.json();
    return { data };
  },

  // === DISPUTE RESOLVER ===
  getDisputes: async (): Promise<ApiResponse<Dispute[]>> => {
    const response = await authService.authenticatedFetch(`${API_URL}/manager/disputes`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch disputes');
    }
    const data = await response.json();
    return { data };
  },

  resolveDispute: async (disputeId: number, resolution: string): Promise<ApiResponse<Dispute>> => {
    const response = await authService.authenticatedFetch(`${API_URL}/manager/disputes/${disputeId}/resolve`, {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to resolve dispute');
    }
    const data = await response.json();
    return { data };
  },

  escalateDispute: async (disputeId: number, escalationReason?: string): Promise<ApiResponse<Dispute>> => {
    const response = await authService.authenticatedFetch(`${API_URL}/manager/disputes/${disputeId}/escalate`, {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ escalationReason }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to escalate dispute');
    }
    const data = await response.json();
    return { data };
  },

  // === USER MANAGEMENT ===
  suspendUser: async (userId: number, reason: string): Promise<ApiResponse<User>> => {
    const response = await authService.authenticatedFetch(`${API_URL}/manager/users/${userId}/suspend`, {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to suspend user');
    }
    const data = await response.json();
    return { data };
  },

  // === CHAT MONITORING ===
  getReportedChats: async (): Promise<ApiResponse<Chat[]>> => {
    // ⚠️ TEMPORARY MOCK — since no backend endpoint yet
    console.warn('⚠️ getReportedChats: No backend endpoint. Returning mock data.');
    return {
      data: [
        {
          id: 1,
          sender: { name: "John Doe" },
          receiver: { name: "Jane Smith" },
          message: "This property is a scam!",
          isReported: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          sender: { name: "Alice Brown" },
          receiver: { name: "Bob White" },
          message: "You never sent the keys!",
          isReported: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
    };
  },
};

// Types (aligned with your page.tsx)
export interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  type: string;
  currentOwner: { name: string; email: string };
  createdAt: string;
  status?:"DRAFT" | "PENDING_VERIFICATION" | "VERIFIED" | "LISTED" | "SOLD" | "REJECTED" | "SUSPENDED";
  verifierNotes?: string;
}

export interface Transaction {
  id: number;
  amount: number;
  status: string;
  buyer: { name: string };
  seller: { name: string };
  property: { title: string };
  createdAt: string;
}

export interface Dispute {
  id: number;
  title: string;
  status: string;
  complainant: { name: string };
  respondent: { name: string };
  property?: { title: string };
  transaction?: { id: number };
  createdAt: string;
}

export interface Chat {
  id: number;
  sender: { name: string };
  receiver: { name: string };
  message: string;
  isReported: boolean;
  createdAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  status: string;
}