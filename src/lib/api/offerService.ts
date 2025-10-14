// src/lib/api/offerService.ts
import { BACKEND_BASE_URL } from '../constants/api';
import { getAuthHeader } from '../auth/authservice';

const API_URL = BACKEND_BASE_URL;

export interface Offer {
  id: number;
  offerId: string;
  propertyId: number;
  buyerId: number;
  sellerId: number;
  amount: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED' | 'WITHDRAWN' | 'COMPLETED';
  expiresAt?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  
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
    propertyId: string;
    title: string;
    location: string;
    images: string[];
    price: number;
  };
  counterOffers?: CounterOffer[];
  messages?: OfferMessage[];
}

export interface CounterOffer {
  id: number;
  offerId: number;
  fromUserId: number;
  amount: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED';
  createdAt: string;
  updatedAt: string;
  fromUser: {
    id: number;
    name: string;
  };
}

export interface OfferMessage {
  id: number;
  offerId: number;
  fromUserId: number;
  content: string;
  messageType: 'GENERAL' | 'SYSTEM' | 'COUNTER_OFFER';
  createdAt: string;
  isRead: boolean;
  fromUser: {
    id: number;
    name: string;
  };
}

export interface CreateOfferData {
  propertyId: string;
  amount: number;
  message?: string;
  expiresAt?: string;
}

export interface OfferStats {
  made: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
  received: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
}

export const offerService = {
  // Create a new offer
  createOffer: async (data: CreateOfferData): Promise<{ status: string; message: string; data: Offer }> => {
    const response = await fetch(`${API_URL}/offers`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create offer');
    }

    return response.json();
  },

  // Get user's offers (made or received)
  getUserOffers: async (type: 'made' | 'received' | 'all' = 'all'): Promise<{ status: string; data: Offer[] }> => {
    const response = await fetch(`${API_URL}/offers/my-offers?type=${type}`, {
      method: 'GET',
      headers: { ...getAuthHeader() },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch offers');
    }

    return response.json();
  },

  // Get offers for a property (property owner only)
  getPropertyOffers: async (propertyId: number): Promise<{ status: string; data: Offer[] }> => {
    const response = await fetch(`${API_URL}/offers/property/${propertyId}`, {
      method: 'GET',
      headers: { ...getAuthHeader() },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch property offers');
    }

    return response.json();
  },

  // Get specific offer details
  getOffer: async (offerId: string): Promise<{ status: string; data: Offer }> => {
    const response = await fetch(`${API_URL}/offers/${offerId}`, {
      method: 'GET',
      headers: { ...getAuthHeader() },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch offer');
    }

    return response.json();
  },

  // Respond to an offer
  respondToOffer: async (
    offerId: string, 
    action: 'ACCEPT' | 'REJECT' | 'COUNTER',
    counterAmount?: number,
    message?: string
  ): Promise<{ status: string; message: string; data: Offer }> => {
    const response = await fetch(`${API_URL}/offers/${offerId}/respond`, {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        counterAmount,
        message,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to respond to offer');
    }

    return response.json();
  },

  // Create counter offer
  createCounterOffer: async (
    offerId: string,
    amount: number,
    message?: string
  ): Promise<{ status: string; message: string; data: CounterOffer }> => {
    const response = await fetch(`${API_URL}/offers/${offerId}/counter`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        message,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create counter offer');
    }

    return response.json();
  },

  // Respond to counter offer
  respondToCounterOffer: async (
    offerId: string,
    counterId: number,
    action: 'ACCEPT' | 'REJECT'
  ): Promise<{ status: string; message: string; data: Offer }> => {
    const response = await fetch(`${API_URL}/offers/${offerId}/counter/${counterId}/respond`, {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to respond to counter offer');
    }

    return response.json();
  },

  // Withdraw offer
  withdrawOffer: async (offerId: string): Promise<{ status: string; message: string; data: Offer }> => {
    const response = await fetch(`${API_URL}/offers/${offerId}/withdraw`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to withdraw offer');
    }

    return response.json();
  },

  // Send message on offer
  sendOfferMessage: async (
    offerId: string,
    content: string,
    messageType?: 'GENERAL' | 'SYSTEM' | 'COUNTER_OFFER'
  ): Promise<{ status: string; message: string; data: OfferMessage }> => {
    const response = await fetch(`${API_URL}/offers/${offerId}/messages`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        messageType: messageType || 'GENERAL',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to send message');
    }

    return response.json();
  },

  // Get offer messages
  getOfferMessages: async (offerId: string): Promise<{ status: string; data: OfferMessage[] }> => {
    const response = await fetch(`${API_URL}/offers/${offerId}/messages`, {
      method: 'GET',
      headers: { ...getAuthHeader() },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch messages');
    }

    return response.json();
  },

  // Mark messages as read
  markMessagesAsRead: async (offerId: string): Promise<{ status: string; message: string }> => {
    const response = await fetch(`${API_URL}/offers/${offerId}/messages/mark-read`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to mark messages as read');
    }

    return response.json();
  },

  // Get offer statistics
  getOfferStats: async (): Promise<{ status: string; data: OfferStats }> => {
    const response = await fetch(`${API_URL}/offers/stats/summary`, {
      method: 'GET',
      headers: { ...getAuthHeader() },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch offer stats');
    }

    return response.json();
  },

  // Helper: Check if user can make payment (offer is accepted)
  canMakePayment: (offer: Offer, userId: number): boolean => {
    return offer.status === 'ACCEPTED' && offer.buyerId === userId;
  },

  // Helper: Get offer status display text
  getOfferStatusText: (status: Offer['status']): string => {
    switch (status) {
      case 'PENDING': return 'Pending Review';
      case 'ACCEPTED': return 'Accepted - Ready for Payment';
      case 'REJECTED': return 'Rejected';
      case 'COUNTERED': return 'Counter Offer Made';
      case 'EXPIRED': return 'Expired';
      case 'WITHDRAWN': return 'Withdrawn';
      case 'COMPLETED': return 'Completed';
      default: return status;
    }
  },

  // Helper: Get offer status color
  getOfferStatusColor: (status: Offer['status']): string => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'ACCEPTED': return 'green';
      case 'REJECTED': return 'red';
      case 'COUNTERED': return 'blue';
      case 'EXPIRED': return 'gray';
      case 'WITHDRAWN': return 'gray';
      case 'COMPLETED': return 'emerald';
      default: return 'gray';
    }
  },
};