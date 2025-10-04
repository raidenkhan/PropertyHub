// Shared property type definitions matching backend structure

export interface PropertyCoordinates {
  lat: number;
  lng: number;
}

export interface PropertyOwner {
  id: number;
  name: string;
}

// Raw property object as received from backend
export interface RawProperty {
  id: number;
  propertyId: string;
  title: string;
  description: string;
  price: number; // Raw numeric price
  type: 'OFFICE' | 'APPARTMENT' | 'LAND' | 'HOUSE';
  location: string;
  coordinates: PropertyCoordinates;
  images: string[];
  amenities: string[];
  specifications: Record<string, any>;
  bedrooms: number;
  bathrooms: number;
  area: number; // Raw numeric area
  currentOwnerId: number;
  listedById: number;
  status: 'LISTED' | 'SOLD' | 'AVAILABLE' | 'RENT';
  isVerified: boolean;
  verifiedById?: number;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  listedAt?: string;
  soldAt?: string;
  likesCount: number;
  currentOwner: PropertyOwner;
}

// Frontend property object with transformed/formatted fields
export interface Property {
  id: string; // Convert to string for consistency with existing frontend
  propertyId?: string; // Make optional for backward compatibility
  title: string;
  description?: string;
  price: string; // Formatted price (e.g., "₦1.2M")
  type: string; // Required by existing components
  location: string;
  coordinates: PropertyCoordinates; // Required by existing components
  images?: string[];
  image: string; // First image from array
  amenities?: string[];
  specifications?: Record<string, any>;
  bedrooms?: number;
  bathrooms?: number;
  area?: string; // Formatted area (e.g., "150m²")
  currentOwnerId?: number;
  listedById?: number;
  status: 'Available' | 'Sold' | 'Rent'; // Normalized status
  isVerified?: boolean;
  verifiedById?: number;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  listedAt?: string;
  soldAt?: string;
  likesCount?: number; // Make optional for backward compatibility
  isLiked?: boolean;
  currentOwner?: PropertyOwner;
  // Frontend-only fields (required for existing components)
  rating: number;
  reviews: number;
}

// Property card props interface
export interface PropertyCardProps extends Property {
  onLike?: (id: string) => void;
  delay?: number;
  viewMode?: 'grid' | 'list';
}

// Wishlist-specific property (always liked)
export interface WishlistProperty extends Property {
  isLiked: true;
  propertyId: string; // Required for wishlist items
  coordinates: PropertyCoordinates; // Required for wishlist items  
  likesCount: number; // Required for wishlist items
  type: string; // Required for wishlist items
}

// API response interfaces
export interface PropertyListResponse {
  data: RawProperty[];
  pagination?: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export interface WishlistResponse {
  properties: WishlistProperty[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export interface LikeResponse {
  liked: boolean;
  likesCount: number;
}

// Helper type for property search/filter params
export interface PropertySearchParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  location?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
}