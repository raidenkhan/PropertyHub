"use client"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { PropertyCard } from "@/components/PropertyCard"

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

interface UnsortedPropertiesViewProps {
  properties: Property[]
  onLike: (id: string) => void
  viewMode: "grid" | "list"
  loading: boolean
  error: string | null
}

export function UnsortedPropertiesView({
  properties,
  onLike,
  viewMode,
  loading,
  error
}: UnsortedPropertiesViewProps) {
  // Loading state
  if (loading) {
    return (
      <div className="space-y-12 px-6">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-lg text-foreground dark:text-white">Loading properties...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-12 px-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-lg text-red-600 dark:text-red-400 mb-4">
              Failed to load properties: {error}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No properties found
  if (!properties || properties.length === 0) {
    return (
      <div className="space-y-12 px-6">
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-muted-foreground dark:text-gray-400">
            No properties found. Check back later!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white mb-2">
          All Properties
        </h2>
        <p className="text-muted-foreground dark:text-gray-300">
          Showing {properties.length} properties across all locations
        </p>
      </motion.div>

      {/* Properties Grid */}
      <motion.div
        className={`grid gap-6 ${
          viewMode === "grid" 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1"
        }`}
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {properties.map((property, index) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: Math.min(index * 0.05, 1) }}
          >
            <PropertyCard
              {...property}
              onLike={onLike}
              delay={0}
              viewMode={viewMode}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}