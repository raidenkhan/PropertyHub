// lib/api/hostDashboardService.ts
import { getAuthHeader } from '../auth/authservice';
import { BACKEND_BASE_URL } from '../constants/api';

// Types based on your schema
export interface Property {
  id: number;
  propertyId: string;
  title: string;
  description: string;
  price: number;
  type: 'RENT' | 'SALE' | 'LEASE' | 'STAY'; 
  location: string;
  coordinates?: { lat: number; lng: number };
  images: string[];
  amenities: string[];
  specifications?: any;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'LISTED' | 'UNDER_OFFER' | 'SOLD' | 'DELISTED' | 'SUSPENDED';
  isVerified: boolean;
  currentOwner: {
    id: number;
    name: string;
    email: string;
  };
  listedBy?: {
    id: number;
    name: string;
  };
  verifiedBy?: {
    id: number;
    name: string;
  };
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  listedAt?: string;
  soldAt?: string;
}

export interface Transaction {
  id: number;
  transactionId: string;
  amount: number;
  status: 'PENDING' | 'ESCROW' | 'PAYMENT_CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
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
    propertyId: string;
  };
  escrowAmount?: number;
  escrowReleased: boolean;
  escrowReleasedAt?: string;
  paymentReference?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Message {
  id: number;
  content: string;
  sender: {
    id: number;
    name: string;
    avatar?: string;
  };
  receiver: {
    id: number;
    name: string;
    avatar?: string;
  };
  isRead: boolean;
  createdAt: string;
}

export interface PropertyStats {
  totalProperties: number;
  listedProperties: number;
  soldProperties: number;
  pendingVerification: number;
  draftProperties: number;
  rejectedProperties: number;
  totalViews: number;
  totalInquiries: number;
}

export interface CreatePropertyData {
  title: string;
  description: string;
  price: number;
  type: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'LAND' | 'OFFICE' | 'WAREHOUSE';
  location: string;
  coordinates?: { lat: number; lng: number };
  images: string[];
  amenities: string[];
  specifications?: any;
}

export interface UpdatePropertyData extends Partial<CreatePropertyData> {}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class HostDashboardService {
  private baseUrl = BACKEND_BASE_URL;

  // === PROPERTY MANAGEMENT ===

  /**
   * Get user's own properties with filtering
   */
  async getMyProperties(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Property>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const response = await fetch(`${this.baseUrl}/properties/my/properties?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch properties');
    }

    const result = await response.json();
    return {
      data: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Create new property
   */
  async createProperty(propertyData: CreatePropertyData): Promise<Property> {
    const response = await fetch(`${this.baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(propertyData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create property');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Update property
   */
  async updateProperty(propertyId: number, updates: UpdatePropertyData): Promise<Property> {
    const response = await fetch(`${this.baseUrl}/properties/${propertyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update property');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Delete property
   */
  async deleteProperty(propertyId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/properties/${propertyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete property');
    }
  }

  /**
   * List property for sale
   */
  async listProperty(propertyId: number): Promise<Property> {
    const response = await fetch(`${this.baseUrl}/properties/${propertyId}/list`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to list property');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Delist property
   */
  async delistProperty(propertyId: number): Promise<Property> {
    const response = await fetch(`${this.baseUrl}/properties/${propertyId}/delist`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delist property');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Submit property for verification
   */
  async submitForVerification(propertyId: number): Promise<Property> {
    const response = await fetch(`${this.baseUrl}/properties/${propertyId}/submit-for-verification`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit for verification');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Check if user can edit property
   */
  async canEditProperty(propertyId: number): Promise<{ can_edit: boolean; reason: string }> {
    const response = await fetch(`${this.baseUrl}/properties/${propertyId}/can-edit`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check edit permissions');
    }

    const result = await response.json();
    return result.data;
  }

  // === TRANSACTION MANAGEMENT ===

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(params?: {
    page?: number;
    limit?: number;
    role?: 'buyer' | 'seller' | 'all';
  }): Promise<PaginatedResponse<Transaction>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);

    const response = await fetch(`${this.baseUrl}/payments/my-transactions?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch transaction history');
    }

    const result = await response.json();
    return {
      data: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(): Promise<{
    total: number;
    pending: number;
    escrow: number;
    completed: number;
    cancelled: number;
  }> {
    const response = await fetch(`${this.baseUrl}/transactions/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch transaction stats');
    }

    const result = await response.json();
    return result.data;
  }

  // === MESSAGING ===

  /**
   * Get user conversations
   */
  async getConversations(): Promise<Array<{
    partner: {
      id: number;
      name: string;
      avatar?: string;
      isActive: boolean;
    };
    lastMessage: Message;
    unreadCount: number;
  }>> {
    const response = await fetch(`${this.baseUrl}/messages/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch conversations');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get conversation with specific user
   */
  async getConversation(otherUserId: number): Promise<Message[]> {
    const response = await fetch(`${this.baseUrl}/messages/${otherUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch conversation');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Send message
   */
  async sendMessage(receiverId: number, content: string): Promise<Message> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ receiverId, content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send message');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/messages/unread-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch unread count');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Mark messages as read
   */
  async markAsRead(otherUserId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/messages/${otherUserId}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mark messages as read');
    }
  }

  // === DASHBOARD STATS ===

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<{
    properties: PropertyStats;
    transactions: {
      total: number;
      pending: number;
      escrow: number;
      completed: number;
      cancelled: number;
    };
    messages: {
      unreadCount: number;
      totalConversations: number;
    };
    revenue: {
      totalEarnings: number;
      pendingPayouts: number;
      thisMonth: number;
    };
  }> {
    // This would ideally be a single endpoint, but we'll combine multiple calls
    const [properties, transactionStats, unreadCount] = await Promise.all([
      this.getMyProperties({ limit: 1000 }), // Get all to calculate stats
      this.getTransactionStats(),
      this.getUnreadCount(),
    ]);

    // Calculate property stats
    const propertyStats: PropertyStats = {
      totalProperties: properties.data.length,
      listedProperties: properties.data.filter(p => p.status === 'LISTED').length,
      soldProperties: properties.data.filter(p => p.status === 'SOLD').length,
      pendingVerification: properties.data.filter(p => p.status === 'PENDING_VERIFICATION').length,
      draftProperties: properties.data.filter(p => p.status === 'DRAFT').length,
      rejectedProperties: properties.data.filter(p => p.status === 'DELISTED').length,
      totalViews: 0, // This would come from a separate analytics endpoint
      totalInquiries: 0, // This would come from a separate analytics endpoint
    };

    return {
      properties: propertyStats,
      transactions: transactionStats,
      messages: {
        unreadCount,
        totalConversations: 0, // Would need to calculate from conversations
      },
      revenue: {
        totalEarnings: 0, // Would need to calculate from completed transactions
        pendingPayouts: 0, // Would need to calculate from escrow transactions
        thisMonth: 0, // Would need to filter by date
      },
    };
  }

  // === UTILITY METHODS ===

  /**
   * Get single property details
   */
  async getPropertyById(propertyId: number): Promise<Property> {
    const response = await fetch(`${this.baseUrl}/properties/${propertyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch property');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Upload property images (if you have a separate upload endpoint)
   */
  async uploadPropertyImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await fetch(`${this.baseUrl}/upload/property-images`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload images');
    }

    const result = await response.json();
    return result.data.imageUrls;
  }
}

export const hostDashboardService = new HostDashboardService();