import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// lib/utils/propertyConverter.ts
import { Property, PropertyCoordinates, RawProperty } from "@/types/property"

export interface LocationCategory {
  id: string
  title: string
  location: string
  count: number
  trending?: boolean
  recent?: boolean
  popular?: boolean
  properties: Property[]
}

// Use the shared RawProperty type for consistency
type BackendProperty = RawProperty

// Category response (for pre-grouped properties)
interface CategoryResponse {
  id: string
  title: string
  location: string
  count: number
  trending?: boolean
  recent?: boolean
  popular?: boolean
  properties: Property[]
}

// Main conversion function
export const convertPropertyData = (
  apiData: (CategoryResponse | BackendProperty)[]
): { categories: LocationCategory[], allProperties: Property[] } => {
  const categories: LocationCategory[] = []
  const allProperties: Property[] = []
  const locationMap = new Map<string, LocationCategory>()

  console.log('Converting API data:', apiData)

  apiData.forEach((item, index) => {
    console.log(`Processing item ${index}:`, item)
    
    // Check if it's a category with nested properties
    if (isCategory(item)) {
      console.log('Processing as category:', item.title)
      const category: LocationCategory = {
        id: item.id,
        title: item.title,
        location: item.location,
        count: item.count,
        trending: item.trending,
        recent: item.recent,
        popular: item.popular,
        properties: item.properties.map(convertFrontendProperty)
      }
      categories.push(category)
      allProperties.push(...category.properties)
    } else {
      // It's an individual property from backend
      console.log('Processing as backend property:', item.title)
      const convertedProperty = convertBackendProperty(item as BackendProperty)
      allProperties.push(convertedProperty)
      
      // Group by location for categories
      const locationKey = extractLocationKey(convertedProperty.location)
      let category = locationMap.get(locationKey)
      
      if (!category) {
        category = {
          id: locationKey,
          title: `Properties in ${extractCityName(convertedProperty.location)}`,
          location: convertedProperty.location,
          count: 0,
          properties: []
        }
        locationMap.set(locationKey, category)
        categories.push(category)
      }
      
      category.properties.push(convertedProperty)
      category.count++
    }
  })

  console.log('Conversion complete:', { categories: categories.length, properties: allProperties.length })
  return { categories, allProperties }
}

// Type guard to check if item is a category or individual property
const isCategory = (item: any): item is CategoryResponse => {
  return item && 
         typeof item.id === 'string' && 
         item.title && 
         item.location && 
         Array.isArray(item.properties)
}

// Convert backend property to frontend format
const convertBackendProperty = (backendProp: BackendProperty): Property => {
  console.log('Converting backend property:', backendProp.title)
  
  return {
    id: backendProp.propertyId || backendProp.id.toString(),
    propertyId: backendProp.propertyId,
    title: backendProp.title,
    location: backendProp.location,
    price: formatPrice(backendProp.price),
    type: normalizePropertyType(backendProp.type),
    status: normalizeStatus(backendProp.status),
    bedrooms: backendProp.bedrooms,
    bathrooms: backendProp.bathrooms,
    area: backendProp.area ? `${backendProp.area}sqm` : undefined,
    rating: generateRating(),
    reviews: generateReviewCount(),
    image: getPropertyImage(backendProp),
    images: backendProp.images || [],
    isLiked: false,
    likesCount: 0, // Default to 0 for new properties
    coordinates: backendProp.coordinates || { lat: 0, lng: 0 }, // Provide default coordinates
    description: backendProp.description,
    amenities: backendProp.amenities,
    specifications: backendProp.specifications,
    currentOwner: backendProp.currentOwner,
    currentOwnerId: backendProp.currentOwnerId,
    listedById: backendProp.listedById,
    isVerified: backendProp.isVerified,
    verifiedById: backendProp.verifiedById,
    verifiedAt: backendProp.verifiedAt,
    createdAt: backendProp.createdAt,
    updatedAt: backendProp.updatedAt,
    listedAt: backendProp.listedAt,
    soldAt: backendProp.soldAt
  }
}

// Convert frontend property (ensure all required fields are present)
const convertFrontendProperty = (prop: Property): Property => {
  return {
    ...prop,
    rating: prop.rating || generateRating(),
    reviews: prop.reviews || generateReviewCount(),
    isLiked: prop.isLiked || false,
    price: prop.price || '₦0'
  }
}

// Ensure property has proper formatting (for cached/retrieved properties)
export const ensurePropertyFormat = (prop: any): Property => {
  // If it's already a properly formatted Property, just ensure all fields are present
  if (prop && typeof prop.id === 'string' && prop.price && prop.price.includes('₦')) {
    return {
      ...prop,
      rating: prop.rating || generateRating(),
      reviews: prop.reviews || generateReviewCount(),
      isLiked: prop.isLiked || false,
      coordinates: prop.coordinates || { lat: 0, lng: 0 },
      image: prop.image || getDefaultImage(prop.type || 'House'),
      images: prop.images || [],
    }
  }
  
  // If it's a raw property or partially converted, do full conversion
  if (prop && typeof prop.id === 'number') {
    return convertBackendProperty(prop as BackendProperty)
  }
  
  // Handle string IDs but missing formatting
  return {
    id: prop.id || prop.propertyId || Math.random().toString(),
    propertyId: prop.propertyId,
    title: prop.title || 'Untitled Property',
    location: prop.location || 'Unknown Location',
    price: prop.price && prop.price.includes('₦') ? prop.price : formatPrice(prop.price || 0),
    type: normalizePropertyType(prop.type || 'House'),
    status: normalizeStatus(prop.status || 'Available'),
    bedrooms: prop.bedrooms,
    bathrooms: prop.bathrooms,
    area: prop.area && typeof prop.area === 'string' ? prop.area : prop.area ? `${prop.area}sqm` : undefined,
    rating: prop.rating || generateRating(),
    reviews: prop.reviews || generateReviewCount(),
    image: prop.image || getDefaultImage(prop.type || 'House'),
    images: prop.images || [],
    isLiked: prop.isLiked || false,
    likesCount: prop.likesCount || 0,
    coordinates: prop.coordinates || { lat: 0, lng: 0 },
    description: prop.description,
    amenities: prop.amenities,
    specifications: prop.specifications,
    currentOwner: prop.currentOwner,
    currentOwnerId: prop.currentOwnerId,
    listedById: prop.listedById,
    isVerified: prop.isVerified,
    verifiedById: prop.verifiedById,
    verifiedAt: prop.verifiedAt,
    createdAt: prop.createdAt,
    updatedAt: prop.updatedAt,
    listedAt: prop.listedAt,
    soldAt: prop.soldAt
  }
}

// Helper functions
const formatPrice = (price: number | string): string => {
  if (typeof price === 'string') {
    // If already formatted, return as is
    if (price.includes('₦')) return price
    // If numeric string, convert to number
    price = parseInt(price)
  }
  
  // Convert number to Nigerian Naira format
  if (price >= 1000000000) {
    return `₦${(price / 1000000000).toFixed(1)}B`
  } else if (price >= 1000000) {
    return `₦${(price / 1000000).toFixed(1)}M`
  } else if (price >= 1000) {
    return `₦${(price / 1000).toFixed(0)}K`
  } else {
    return `₦${price.toLocaleString()}`
  }
}

const normalizePropertyType = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'RENT': 'Apartment',
    'SALE': 'House', 
    'BUY': 'House',
    'COMMERCIAL': 'Commercial',
    'LAND': 'Land',
    'OFFICE': 'Office',
    'APARTMENT': 'Apartment',
    'HOUSE': 'House',
    'SHOP': 'Commercial'
  }
  
  const normalizedType = typeMap[type.toUpperCase()]
  return normalizedType || capitalizeFirst(type)
}

const normalizeStatus = (status: string): "Available" | "Sold" | "Rent" => {
  const statusMap: { [key: string]: "Available" | "Sold" | "Rent" } = {
    'LISTED': 'Available',
    'AVAILABLE': 'Available',
    'FOR_SALE': 'Available',
    'ACTIVE': 'Available',
    'SOLD': 'Sold',
    'RENT': 'Rent',
    'RENTED': 'Rent',
    'FOR_RENT': 'Rent',
    'LEASED': 'Rent'
  }
  return statusMap[status.toUpperCase()] || 'Available'
}

const extractLocationKey = (location: string): string => {
  return location
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .slice(0, 50) // Limit length
}

const extractCityName = (location: string): string => {
  // Extract city name from full location
  // e.g., "Victoria Island, Lagos" -> "Lagos"
  // e.g., "Maitama, Abuja" -> "Abuja"
  // e.g., "Lekki Phase 1, Lagos" -> "Lagos"
  // e.g., "Eastern Ibo 3223" -> "Eastern Ibo"
  
  const parts = location.split(',')
  if (parts.length > 1) {
    // Get the last part which should be the city
    let cityName = parts[parts.length - 1].trim()
    
    // Handle cases where state might be included: "Lagos, Lagos State" -> "Lagos"
    if (cityName.toLowerCase().includes('state')) {
      const cityParts = cityName.split(' ')
      cityName = cityParts[0]
    }
    
    return cityName
  }
  
  // If no comma, try to extract city from single location string
  const words = location.split(' ')
  
  // Common patterns: "Lagos Island", "Abuja Central", etc.
  const commonCities = ['lagos', 'abuja', 'kano', 'ibadan', 'benin', 'port', 'kaduna', 'jos', 'ilorin', 'owerri', 'enugu', 'abeokuta', 'onitsha', 'warri']
  
  for (const city of commonCities) {
    if (location.toLowerCase().includes(city)) {
      return city.charAt(0).toUpperCase() + city.slice(1)
    }
  }
  
  // Special case for Port Harcourt
  if (location.toLowerCase().includes('port harcourt') || location.toLowerCase().includes('portharcourt')) {
    return 'Port Harcourt'
  }
  
  // Fallback: take first 1-2 words
  return words.slice(0, Math.min(2, words.length)).join(' ')
}

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180)
  const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * (Math.PI / 180)) * Math.cos(coord2.lat * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Group properties by city-level location clusters
const groupPropertiesByLocationClusters = (properties: Property[]): LocationCategory[] => {
  const cityGroups = new Map<string, Property[]>()
  
  // Group properties by city name
  properties.forEach((property) => {
    const cityName = extractCityName(property.location)
    const normalizedCity = cityName.toLowerCase().trim()
    
    if (!cityGroups.has(normalizedCity)) {
      cityGroups.set(normalizedCity, [])
    }
    cityGroups.get(normalizedCity)!.push(property)
  })
  
  // Convert city groups to location categories
  const categories: LocationCategory[] = []
  
  cityGroups.forEach((cityProperties, normalizedCityName) => {
    if (cityProperties.length === 0) return
    
    // Use the original city name from the first property for display
    const displayCityName = extractCityName(cityProperties[0].location)
    
    // Create a more descriptive title
    const categoryTitle = cityProperties.length > 10 
      ? `Popular Properties in ${displayCityName}`
      : cityProperties.length > 5
      ? `Available Properties in ${displayCityName}`
      : `Properties in ${displayCityName}`
    
    // Calculate center coordinates for the city if needed
    const avgCoordinates = cityProperties.reduce(
      (acc, prop) => ({
        lat: acc.lat + prop.coordinates.lat,
        lng: acc.lng + prop.coordinates.lng
      }),
      { lat: 0, lng: 0 }
    )
    avgCoordinates.lat /= cityProperties.length
    avgCoordinates.lng /= cityProperties.length
    
    const category: LocationCategory = {
      id: extractLocationKey(`city-${normalizedCityName}`),
      title: categoryTitle,
      location: displayCityName, // Use just the city name for cleaner display
      count: cityProperties.length,
      properties: cityProperties,
      // Add metadata based on property count and characteristics
      trending: cityProperties.length >= 8 && Math.random() > 0.6,
      recent: cityProperties.some(p => p.description?.toLowerCase().includes('new')) || Math.random() > 0.8,
      popular: cityProperties.length >= 10
    }
    
    categories.push(category)
  })
  
  // Sort by property count descending, then alphabetically by city name
  return categories.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count
    }
    return a.location.localeCompare(b.location)
  })
}

const generateRating = (seed?: string): number => {
  if (seed) {
    // Generate deterministic rating based on seed
    const hash = seed.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    const random = Math.abs(hash % 1000) / 1000; // Convert to 0-1
    return Math.round((random * (4.9 - 4.0) + 4.0) * 10) / 10
  }
  return Math.round((Math.random() * (4.9 - 4.0) + 4.0) * 10) / 10
}

const generateReviewCount = (seed?: string): number => {
  if (seed) {
    // Generate deterministic review count based on seed
    const hash = seed.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    const random = Math.abs(hash % 1000) / 1000; // Convert to 0-1
    return Math.floor(random * 50) + 5
  }
  return Math.floor(Math.random() * 50) + 5
}

const getPropertyImage = (backendProp: BackendProperty): string => {
  // Priority order for getting images:
  // 1. First image from images array
  // 2. imageUrl property (if exists)
  // 3. image property (if exists)
  // 4. Default image based on property type
  
  // Check images array first
  if (backendProp.images && backendProp.images.length > 0) {
    const firstImage = backendProp.images[0]
    if (firstImage && firstImage.trim() !== '') {
      console.log('Using image from images array:', firstImage)
      return firstImage
    }
  }
  
  // Check imageUrl property
  if ((backendProp as any).imageUrl && (backendProp as any).imageUrl.trim() !== '') {
    console.log('Using imageUrl:', (backendProp as any).imageUrl)
    return (backendProp as any).imageUrl
  }
  
  // Check image property
  if ((backendProp as any).image && (backendProp as any).image.trim() !== '') {
    console.log('Using image property:', (backendProp as any).image)
    return (backendProp as any).image
  }
  
  // Fallback to default image
  const defaultImg = getDefaultImage(backendProp.type)
  console.log('Using default image for type', backendProp.type, ':', defaultImg)
  return defaultImg
}

const getDefaultImage = (type: string): string => {
  const defaultImages: { [key: string]: string } = {
    'Apartment': 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&h=600&fit=crop',
    'House': 'https://images.unsplash.com/photo-1675529734325-f735f7a25121?w=800&h=600&fit=crop',
    'Commercial': 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800&h=600&fit=crop',
    'Office': 'https://images.unsplash.com/photo-1637095937545-7d8c1edf4d2b?w=800&h=600&fit=crop',
    'Land': 'https://images.unsplash.com/photo-1601622962666-d0b6d43a7ac7?w=800&h=600&fit=crop'
  }
  return defaultImages[type] || defaultImages['House']
}

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Export individual helper functions if needed elsewhere
export {
  formatPrice,
  normalizePropertyType,
  normalizeStatus,
  extractLocationKey,
  generateRating,
  generateReviewCount,
  groupPropertiesByLocationClusters
}
