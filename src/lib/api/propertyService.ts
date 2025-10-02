// lib/api/propertyService.ts
import { authService, getAuthHeader } from '../auth/authservice';
import { BACKEND_BASE_URL } from '../constants/api';
import { Property } from './managerService';

interface PropertyFormData {
  title: string;
  description: string;
  type: string;
  price: number;
  location: string;
  coordinates: { lat: number; lng: number } | null;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  images: File[]; // Files, not URLs
}

class PropertyService {
  private baseUrl = BACKEND_BASE_URL;

  // For JSON-only requests
  async createProperty(formData: Omit<PropertyFormData, 'images'> & { images: string[] }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create property');
    }

    return response.json();
  }

  // ✅ NEW: For file uploads
  async createPropertyWithFiles(formData: FormData): Promise<any> {
    console.log("Sending ...")
    const response = await authService.authenticatedFetch(`${this.baseUrl}/properties`, {
      method: 'POST',
   
      body: formData,
    });

    

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create property');
    }

    return response.json();
  }
  // Add this method to PropertyService class
async getAllProperties(): Promise<any> {
  const response = await fetch(`${this.baseUrl}/properties`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch properties');
  }

  return response.json();
}


async getMyProperties(params?: { status?: string; page?: number; limit?: number }): Promise<any> {
  const queryParams = new URLSearchParams();

  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `${this.baseUrl}/properties/my-properties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });
  

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch your properties');
  }

  return response.json();
}

 async deleteProperty(propertyId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/properties/${propertyId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete property');
    }
  }


  async updateProperty(propertyId: number, updates: Partial<Property>): Promise<Property> {
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

    return response.json();
  }

  async getPropertyById(propertyId: string): Promise<any> {
    const response = await authService.authenticatedFetch(`${this.baseUrl}/properties/${propertyId}`, {
      method: 'GET',
   
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch property');
    }

    return response.json();
  }
}


export const propertyService = new PropertyService();