"use client"
import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { SearchFilters, FilterOptions } from "@/components/SearchFilters"
import { PropertyGrid } from "@/components/PropertyGrid"
import { PropertyMap } from "@/app/property-map"
import { TypingAnimation } from "@/components/typing-animation"
import { AnimatedBackground } from "@/components/animated-background"
import { motion } from "framer-motion"
import { MapPin, TrendingUp, Clock, Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PropertyCard } from "@/components/PropertyCard"
import { propertyService } from "@/lib/api/propertyService"
import { convertPropertyData, groupPropertiesByLocationClusters } from "@/lib/utils"
import { UnsortedPropertiesView } from "@/components/UnsortedPropertiesView"
import { ResponsiveLocationButton, CategoryLocationDisplay } from "@/components/ui/responsive-text"

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

// Helper function to parse price string to number for comparison
const parsePriceToNumber = (price: string): number => {
  // Handle both ₦2.5M format and ₦2,500,000 format
  const numericString = price.replace(/[₦,]/g, '')
  
  if (numericString.includes('M')) {
    return parseFloat(numericString.replace('M', '')) * 1000000
  } else if (numericString.includes('K')) {
    return parseFloat(numericString.replace('K', '')) * 1000
  } else if (numericString.includes('B')) {
    return parseFloat(numericString.replace('B', '')) * 1000000000
  }
  
  return parseInt(numericString) || 0
}

// Filter function
const filterProperties = (properties: Property[], filters: FilterOptions): Property[] => {
  return properties.filter((property) => {
    // Location filter
    if (filters.location && !property.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false
    }

    // Property type filter
    if (filters.propertyType && property.type.toLowerCase() !== filters.propertyType.toLowerCase()) {
      return false
    }

    // Price range filter
    if (filters.priceRange) {
      const propertyPrice = parsePriceToNumber(property.price)
      const priceRanges = [
        { label: "Under ₦1M", min: 0, max: 1000000 },
        { label: "₦1M - ₦5M", min: 1000000, max: 5000000 },
        { label: "₦5M - ₦10M", min: 5000000, max: 10000000 },
        { label: "₦10M - ₦50M", min: 10000000, max: 50000000 },
        { label: "₦50M+", min: 50000000, max: Infinity },
      ]
      
      const selectedRange = priceRanges.find(range => range.label === filters.priceRange)
      if (selectedRange && (propertyPrice < selectedRange.min || propertyPrice > selectedRange.max)) {
        return false
      }
    }

    // Bedrooms filter
    if (filters.bedrooms && filters.bedrooms !== "Any") {
      const requiredBedrooms = parseInt(filters.bedrooms.replace('+', ''))
      if (!property.bedrooms || property.bedrooms < requiredBedrooms) {
        return false
      }
    }

    return true
  })
}

function LocationCategories({
  onCategorySelect,
  onLike,
  viewMode,
  filters,
  categories,
  loading,
  error,
}: {
  onCategorySelect: (category: LocationCategory) => void
  onLike: (id: string) => void
  viewMode: "grid" | "list"
  filters: FilterOptions
  categories: LocationCategory[]
  loading: boolean
  error: string | null
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const router = useRouter()

  const handleCategoryClick = (category: LocationCategory) => {
    setSelectedCategory(category.id)
    onCategorySelect(category)
  }

  const handleShowOnMap = (category: LocationCategory) => {
    router.push(`/map?category=${encodeURIComponent(category.title)}`)
  }

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
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // No categories found
  if (!categories || categories.length === 0) {
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
    <div className="space-y-12 px-6">
      {categories.map((category, index) => {
        // Filter properties in this category based on current filters
        const filteredProperties = filterProperties(category.properties, filters)
        
        // Don't show category if no properties match the filters
        if (filteredProperties.length === 0) {
          return null
        }

        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="space-y-6"
          >
            {/* Category Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground dark:text-white">{category.title}</h2>

                {/* Category Badges */}
                <div className="flex items-center gap-2">
                  {category.trending && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                  {category.recent && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                      <Clock className="w-3 h-3 mr-1" />
                      New
                    </Badge>
                  )}
                  {category.popular && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>
              </div>

              {/* Show on Map Button */}
              <Button
                variant="outline"
                onClick={() => handleShowOnMap(category)}
                className="flex items-center gap-2 bg-background hover:bg-accent dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
                aria-label={`Show ${category.location} on map`}
              >
                <MapPin className="w-4 h-4 dark:text-gray-300" />
                Show on map
              </Button>
            </div>

            {/* Category Info - Updated count to show filtered results with responsive display */}
            <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-300">
              <MapPin className="w-4 h-4 dark:text-gray-300" />
              <CategoryLocationDisplay 
                location={category.location}
                count={filteredProperties.length === category.properties.length 
                  ? category.count 
                  : filteredProperties.length
                }
              />
            </div>

            <motion.div
              className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
              layout
            >
              {filteredProperties.map((property, propertyIndex) => (
                <PropertyCard
                  key={property.id}
                  {...property}
                  onLike={onLike}
                  delay={propertyIndex * 0.1}
                  viewMode={viewMode}
                />
              ))}
            </motion.div>

            {/* View All Button - Updated to use ResponsiveLocationButton component */}
            <div className="text-center">
              <ResponsiveLocationButton
                locationText={category.location}
                propertyCount={filteredProperties.length}
                onClick={() => handleCategoryClick(category)}
                className="bg-background hover:bg-accent dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function App() {
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    // Default to list view on mobile, grid on desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? "list" : "grid"
    }
    return "grid"
  })

  // Handle responsive default view mode changes
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      if (isMobile && viewMode === "grid") {
        setViewMode("list")
      } else if (!isMobile && viewMode === "list" && window.innerWidth > 1024) {
        setViewMode("grid")
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])
  const [showMap, setShowMap] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCategories, setShowCategories] = useState(true)
  const [locationSortingEnabled, setLocationSortingEnabled] = useState(false) // Default to unsorted
  const [filters, setFilters] = useState<FilterOptions>({
    location: "",
    propertyType: "",
    priceRange: "",
    bedrooms: "",
  })

  // State for API data
  const [categories, setCategories] = useState<LocationCategory[]>([])
  const [clusteredCategories, setClusteredCategories] = useState<LocationCategory[]>([])
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch and convert data on component mount
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch data from your API
        const response = await propertyService.getAllProperties()
        const apiData = response.data
        
        console.log('Raw API data:', apiData)
        
        // Convert mixed data format to unified structure
        const { categories: convertedCategories, allProperties: convertedProperties } = 
          convertPropertyData(apiData)
        
        console.log('Converted categories:', convertedCategories)
        console.log('Converted properties:', convertedProperties)
        
        setCategories(convertedCategories)
        setAllProperties(convertedProperties)
        
        // Generate clustered categories for location-based sorting
        const clustered = groupPropertiesByLocationClusters(convertedProperties)
        setClusteredCategories(clustered)
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch properties'
        setError(errorMessage)
        console.error('Property data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyData()
  }, [])

  // Memoized filtered properties
  const filteredProperties = useMemo(() => {
    return filterProperties(allProperties, filters)
  }, [allProperties, filters])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters)
  }, [])

  const handleLike = (id: string) => {
    setAllProperties((prev) =>
      prev.map((property) => (property.id === id ? { ...property, isLiked: !property.isLiked } : property))
    )
    
    // Also update in categories
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        properties: category.properties.map((property) =>
          property.id === id ? { ...property, isLiked: !property.isLiked } : property
        ),
      }))
    )
  }

  const handleCategorySelect = (category: LocationCategory) => {
    setSelectedCategory(category.id)
    setShowCategories(false)
  }

  const handleCloseMap = () => {
    setShowMap(false)
  }

  const handleBackToCategories = () => {
    setShowCategories(true)
    setSelectedCategory(null)
  }

  // Count total filtered properties across all categories
  const totalFilteredCount = useMemo(() => {
    if (loading) return 0
    if (locationSortingEnabled && clusteredCategories) {
      return clusteredCategories.reduce((total, category) => {
        return total + filterProperties(category.properties, filters).length
      }, 0)
    }
    return filteredProperties.length
  }, [locationSortingEnabled, clusteredCategories, filteredProperties, filters, loading])

  return (
    <div className="min-h-screen relative bg-background dark:bg-gray-900">
      <AnimatedBackground />

      <Header />
      <SearchFilters 
        viewMode={viewMode} 
        onViewModeChange={setViewMode} 
        onFiltersChange={handleFiltersChange}
      />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="px-6 py-16 relative"
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-foreground dark:text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <TypingAnimation
              text="Find Your Perfect Property"
              className="bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent dark:from-blue-500 dark:via-violet-500 dark:to-emerald-500"
              speed={80}
            />
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-muted-foreground dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
          >
            Discover premium properties across Nigeria with our advanced search and personalized recommendations
          </motion.p>

          {/* Enhanced Quick Stats with animations */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2 }}
          >
            {[
              { number: loading ? "..." : `${allProperties.length}+`, label: "Properties", delay: 0 },
              { number: loading ? "..." : `${locationSortingEnabled ? clusteredCategories.length : categories.length}+`, label: "Locations", delay: 0.1 },
              { number: "5,000+", label: "Happy Clients", delay: 0.2 },
              { number: "4.9", label: "Average Rating", delay: 0.3 },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="bg-background/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-border dark:bg-gray-800/60 dark:border-gray-700"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 2.2 + stat.delay }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-foreground dark:text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-sm md:text-base text-muted-foreground dark:text-gray-300 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Results Count */}
      {!loading && (filters.location || filters.propertyType || filters.priceRange || filters.bedrooms) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-6 pb-6"
        >
          <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4 border border-border dark:bg-gray-800/60 dark:border-gray-700">
            <p className="text-foreground dark:text-white font-medium">
              {totalFilteredCount === 0 
                ? "No properties match your current filters. Try adjusting your search criteria."
                : `Showing ${totalFilteredCount} properties matching your filters`
              }
            </p>
          </div>
        </motion.div>
      )}

      {/* Location Sorting Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-6 pb-6"
      >
        <div className="flex items-center justify-center">
          <Button
            onClick={() => setLocationSortingEnabled(!locationSortingEnabled)}
            variant={locationSortingEnabled ? "default" : "outline"}
            className={`flex items-center gap-2 px-6 py-3 transition-all duration-300 ${
              locationSortingEnabled 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-background hover:bg-accent dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
            }`}
            aria-label={`${locationSortingEnabled ? 'Disable' : 'Enable'} location-based sorting`}
          >
            <MapPin className="w-4 h-4" />
            {locationSortingEnabled ? "View All Properties" : "Group by Location"}
          </Button>
        </div>
      </motion.div>

      {/* Properties Section */}
      {showCategories ? (
        locationSortingEnabled ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="max-w-7xl mx-auto px-6 py-12"
          >
            <LocationCategories 
              onCategorySelect={handleCategorySelect} 
              onLike={handleLike} 
              viewMode={viewMode}
              filters={filters}
              categories={clusteredCategories}
              loading={loading}
              error={error}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="max-w-7xl mx-auto py-12"
          >
            <UnsortedPropertiesView
              properties={filteredProperties}
              onLike={handleLike}
              viewMode={viewMode}
              loading={loading}
              error={error}
            />
          </motion.div>
        )
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}>
          <div className="max-w-7xl mx-auto px-6 py-6">
            <button
              onClick={handleBackToCategories}
              className="text-primary hover:text-primary/80 font-medium mb-6 flex items-center gap-2 dark:text-blue-400 dark:hover:text-blue-300"
              aria-label="Back to categories"
            >
              ← Back to categories
            </button>
          </div>
          <PropertyGrid properties={filteredProperties} viewMode={viewMode} onLike={handleLike} />
        </motion.div>
      )}

      {/* Property Map */}
      <PropertyMap
        properties={filteredProperties}
        isOpen={showMap}
        onClose={handleCloseMap}
        selectedCategory={selectedCategory ? selectedCategory : undefined}
      />

      {/* Compact Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-gray-900 dark:to-gray-950 text-white py-12 mt-16"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Brand Section */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">PropertyHub</h3>
                <p className="text-sm text-gray-400">Nigeria's Leading Real Estate Platform</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">
                Buy Properties
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">
                Rent Properties
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">
                About Us
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">
                Contact
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">
                Help Center
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 mt-8 pt-6 text-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 PropertyHub. All rights reserved. Made with ❤️ in Nigeria.
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}