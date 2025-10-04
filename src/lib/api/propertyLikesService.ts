// lib/api/propertyLikesService.ts
import { authService, getAuthHeader } from '../auth/authservice';
import { BACKEND_BASE_URL } from '../constants/api';
import { 
  WishlistProperty, 
  WishlistResponse, 
  LikeResponse, 
  PropertySearchParams,
  RawProperty 
} from '../../types/property';

class PropertyLikesService {
  private baseUrl = BACKEND_BASE_URL;

  /**
   * Toggle like status for a property
   */
  async toggleLike(propertyId: string): Promise<LikeResponse> {
    // Frontend passes string ID, but backend might expect propertyId or numeric id
    // We'll use the propertyId (CUID) for the API call
    console.log("Property like : ", propertyId)
    const response = await authService.authenticatedFetch(`${this.baseUrl}/properties/${propertyId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to toggle like' }));
      throw new Error(error.message || 'Failed to toggle like');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Check if a property is liked by the current user
   */
  async isPropertyLiked(propertyId: string): Promise<boolean> {
    try {
      const response = await authService.authenticatedFetch(`${this.baseUrl}/properties/${propertyId}/liked`, {
        method: 'GET',
      });

      if (!response.ok) {
        return false; // If request fails, assume not liked
      }

      const result = await response.json();
      return result.data.isLiked;
    } catch (error) {
      console.error('Failed to check like status:', error);
      return false;
    }
  }

  /**
   * Get user's wishlist (liked properties)
   */
  async getUserWishlist(params?: PropertySearchParams): Promise<WishlistResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice);

    const url = `${this.baseUrl}/properties/wishlist${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await authService.authenticatedFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch wishlist' }));
      throw new Error(error.message || 'Failed to fetch wishlist');
    }

    const result = await response.json();
    
    // Transform the data to match frontend format
    const transformedProperties: WishlistProperty[] = result.data.map((property: RawProperty) => ({
      id: property.propertyId, // Use propertyId as frontend ID for consistency
      propertyId: property.propertyId, // Keep propertyId field
      title: property.title,
      location: property.location,
      price: this.formatPrice(property.price),
      type: this.normalizePropertyType(property.type),
      status: this.normalizeStatus(property.status),
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area ? `${property.area}m²` : undefined,
      rating: this.generateRating(),
      reviews: this.generateReviewCount(),
      image: property.images?.[0] || this.getDefaultImage(property.type),
      images: property.images, // Include full images array
      isLiked: true, // Always true for wishlist items
      likesCount: property.likesCount || 0,
      coordinates: property.coordinates || { lat: 0, lng: 0 },
      description: property.description,
      amenities: property.amenities,
      specifications: property.specifications,
      currentOwner: property.currentOwner,
      listedById: property.listedById,
      currentOwnerId: property.currentOwnerId,
      isVerified: property.isVerified,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    }));

    return {
      properties: transformedProperties,
      pagination: result.pagination,
    };
  }

  /**
   * Remove property from wishlist
   */
  async removeFromWishlist(propertyId: string): Promise<void> {
    await this.toggleLike(propertyId);
  }

  // Helper methods (same as in propertyService)
  private formatPrice(price: number | string): string {
    if (typeof price === 'string') {
      if (price.includes('₦')) return price;
      price = parseInt(price);
    }
    
    if (price >= 1000000000) {
      return `₦${(price / 1000000000).toFixed(1)}B`;
    } else if (price >= 1000000) {
      return `₦${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `₦${(price / 1000).toFixed(0)}K`;
    } else {
      return `₦${price.toLocaleString()}`;
    }
  }

  private normalizePropertyType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'OFFICE': 'Office',
      'APPARTMENT': 'Apartment',
      'LAND': 'Land',
    };
    return typeMap[type.toUpperCase()] || type;
  }

  private normalizeStatus(status: string): "Available" | "Sold" | "Rent" {
    const statusMap: { [key: string]: "Available" | "Sold" | "Rent" } = {
      'LISTED': 'Available',
      'AVAILABLE': 'Available',
      'SOLD': 'Sold',
      'RENT': 'Rent',
    };
    return statusMap[status.toUpperCase()] || 'Available';
  }

  private generateRating(): number {
    return Math.round((Math.random() * (4.9 - 4.0) + 4.0) * 10) / 10;
  }

  private generateReviewCount(): number {
    return Math.floor(Math.random() * 50) + 5;
  }

  private getDefaultImage(type: string): string {
    const defaultImages: { [key: string]: string } = {
      'Apartment': 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&h=600&fit=crop',
      'House': 'https://images.unsplash.com/photo-1675529734325-f735f7a25121?w=800&h=600&fit=crop',
      'Office': 'https://images.unsplash.com/photo-1637095937545-7d8c1edf4d2b?w=800&h=600&fit=crop',
      'Land': 'https://images.unsplash.com/photo-1601622962666-d0b6d43a7ac7?w=800&h=600&fit=crop'
    };
    return defaultImages[type] || defaultImages['House'];
  }
}

export const propertyLikesService = new PropertyLikesService();