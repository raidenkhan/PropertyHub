import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// lib/utils/propertyConverter.ts

// Frontend types (your existing interface)
interface Property {
  id: string
  title: string
  location: string
  price: string
  type: string
  status: "Available" | "Sold" | "Rent"
  bedrooms?: number
  bathrooms?: number
  area?: string
  rating: number
  reviews: number
  image: string
  isLiked?: boolean
  coordinates: { lat: number; lng: number }
  description?: string
  amenities?: string[]
  currentOwner?: {
    id: number
    name: string
  }
}

interface LocationCategory {
  id: string
  title: string
  location: string
  count: number
  trending?: boolean
  recent?: boolean
  popular?: boolean
  properties: Property[]
}

// Backend API response types (based on your data structure)
interface BackendProperty {
  id: number | string
  propertyId?: string
  title: string
  description?: string
  price: number | string
  type: string
  location: string
  coordinates: { lat: number; lng: number }
  images: string[]
  amenities?: string[]
  specifications?: object
  bedrooms?: number
  bathrooms?: number
  area?: number | string
  currentOwnerId?: number
  listedById?: number
  status: string
  isVerified?: boolean
  verifiedById?: number
  verifiedAt?: string
  createdAt?: string
  updatedAt?: string
  listedAt?: string | null
  soldAt?: string | null
  currentOwner?: {
    id: number
    name: string
  }
}

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
    image: backendProp.images?.[0] || getDefaultImage(backendProp.type),
    isLiked: false,
    coordinates: backendProp.coordinates,
    description: backendProp.description,
    amenities: backendProp.amenities,
    currentOwner: backendProp.currentOwner
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
  // e.g., "Eastern Ibo 3223" -> "Eastern Ibo"
  
  const parts = location.split(',')
  if (parts.length > 1) {
    return parts[parts.length - 1].trim()
  }
  
  // If no comma, take first few words
  const words = location.split(' ')
  return words.slice(0, 2).join(' ')
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

// Group properties by location clusters (within 5km radius)
const groupPropertiesByLocationClusters = (properties: Property[]): LocationCategory[] => {
  const categories: LocationCategory[] = []
  const processedProperties: Set<string> = new Set()
  
  properties.forEach((property) => {
    if (processedProperties.has(property.id)) return
    
    // Find all properties within 5km of current property
    const nearbyProperties = properties.filter((otherProperty) => {
      if (processedProperties.has(otherProperty.id)) return false
      
      const distance = calculateDistance(property.coordinates, otherProperty.coordinates)
      return distance <= 5 // 5km radius
    })
    
    // Mark all nearby properties as processed
    nearbyProperties.forEach(p => processedProperties.add(p.id))
    
    // Create location category for this cluster
    const locationNames = [...new Set(nearbyProperties.map(p => extractCityName(p.location)))]
    const primaryLocation = locationNames[0]
    const categoryTitle = locationNames.length > 1 
      ? `${primaryLocation} Area` 
      : `Properties in ${primaryLocation}`
    
    const category: LocationCategory = {
      id: extractLocationKey(`cluster-${primaryLocation}-${categories.length}`),
      title: categoryTitle,
      location: nearbyProperties[0].location, // Use the first property's full location
      count: nearbyProperties.length,
      properties: nearbyProperties,
      // Add some randomized metadata
      trending: Math.random() > 0.7,
      recent: Math.random() > 0.8,
      popular: nearbyProperties.length >= 5
    }
    
    categories.push(category)
  })
  
  return categories.sort((a, b) => b.count - a.count) // Sort by property count descending
}

const generateRating = (): number => {
  return Math.round((Math.random() * (4.9 - 4.0) + 4.0) * 10) / 10
}

const generateReviewCount = (): number => {
  return Math.floor(Math.random() * 50) + 5
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
