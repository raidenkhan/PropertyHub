"use client"
import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { SearchFilters, FilterOptions } from "@/components/SearchFilters"
import { PropertyGrid } from "@/components/PropertyGrid"
import { PropertyMap } from "@/app/property-map"
import { TypingAnimation } from "@/components/typing-animation"
import { AnimatedBackground } from "@/components/animated-background"
import { motion } from "framer-motion"
import { MapPin, TrendingUp, Clock, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

const locationCategories: LocationCategory[] = [
  {
    id: "lagos-vi",
    title: "Popular homes in Victoria Island",
    location: "Victoria Island, Lagos",
    count: 1200,
    popular: true,
    properties: [
      {
        id: "1",
        title: "Modern 3BR Apartment in Victoria Island",
        location: "Victoria Island, Lagos",
        price: "₦2,500,000",
        type: "Apartment",
        status: "Available",
        bedrooms: 3,
        bathrooms: 2,
        area: "120sqm",
        rating: 4.8,
        reviews: 24,
        image:
          "https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NTc0Nzk2MDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        isLiked: false,
        coordinates: { lat: 6.4281, lng: 3.4219 },
      },
      {
        id: "4",
        title: "Executive Office Space in VI",
        location: "Victoria Island, Lagos",
        price: "₦3,500,000",
        type: "Office",
        status: "Rent",
        area: "200sqm",
        rating: 4.7,
        reviews: 15,
        image:
          "https://images.unsplash.com/photo-1637095937545-7d8c1edf4d2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjBzcGFjZSUyMGludGVyaW9yfGVufDF8fHx8MTc1NzU1MDU3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        isLiked: false,
        coordinates: { lat: 6.4281, lng: 3.4219 },
      },
    ],
  },
  {
    id: "lagos-lekki",
    title: "Trending in Lekki Phase 1",
    location: "Lekki Phase 1, Lagos",
    count: 850,
    trending: true,
    properties: [
      {
        id: "3",
        title: "Luxury 5BR Detached House in Lekki",
        location: "Lekki Phase 1, Lagos",
        price: "₦45,000,000",
        type: "House",
        status: "Available",
        bedrooms: 5,
        bathrooms: 4,
        area: "350sqm",
        rating: 4.9,
        reviews: 31,
        image:
          "https://images.unsplash.com/photo-1675529734325-f735f7a25121?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkZXRhY2hlZCUyMGhvdXNlfGVufDF8fHx8MTc1NzU1MDU3N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        isLiked: false,
        coordinates: { lat: 6.4433, lng: 3.5244 },
      },
      {
        id: "6",
        title: "Beautiful 2BR Apartment with Pool",
        location: "Ikoyi, Lagos",
        price: "₦8,500,000",
        type: "Apartment",
        status: "Rent",
        bedrooms: 2,
        bathrooms: 2,
        area: "95sqm",
        rating: 4.8,
        reviews: 22,
        image:
          "https://images.unsplash.com/photo-1564078516393-cf04bd966897?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3VzZSUyMGludGVyaW9yfGVufDF8fHx8MTc1NzU1MDU3Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        isLiked: false,
        coordinates: { lat: 6.4285, lng: 3.4215 },
      },
    ],
  },
  {
    id: "abuja-maitama",
    title: "Available next month in Maitama",
    location: "Maitama, Abuja",
    count: 320,
    recent: true,
    properties: [
      {
        id: "5",
        title: "Premium Land Plot in Abuja",
        location: "Maitama, Abuja",
        price: "₦25,000,000",
        type: "Land",
        status: "Available",
        area: "1000sqm",
        rating: 4.5,
        reviews: 8,
        image:
          "https://images.unsplash.com/photo-1601622962666-d0b6d43a7ac7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW5kJTIwcGxvdCUyMHByb3BlcnR5fGVufDF8fHx8MTc1NzU1MDU4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        isLiked: true,
        coordinates: { lat: 9.0578, lng: 7.4951 },
      },
      {
        id: "2",
        title: "Prime Commercial Shop Space in Ikeja",
        location: "Ikeja, Lagos",
        price: "₦1,200,000",
        type: "Commercial",
        status: "Rent",
        area: "85sqm",
        rating: 4.6,
        reviews: 18,
        image:
          "https://images.unsplash.com/photo-1541558869434-2840d308329a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwb2ZmaWNlJTIwc3BhY2V8ZW58MXx8fHwxNzU3NTQ0MTk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        isLiked: true,
        coordinates: { lat: 6.6018, lng: 3.3515 },
      },
    ],
  },
]

// Helper function to parse price string to number for comparison
const parsePriceToNumber = (price: string): number => {
  const numericValue = price.replace(/[₦,]/g, '').replace(/[KMB]/g, (match) => {
    switch (match) {
      case 'K': return '000'
      case 'M': return '000000'
      case 'B': return '000000000'
      default: return ''
    }
  })
  return parseInt(numericValue) || 0
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
}: {
  onCategorySelect: (category: LocationCategory) => void
  onLike: (id: string) => void
  viewMode: "grid" | "list"
  filters: FilterOptions
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

  return (
    <div className="space-y-12 px-6">
      {locationCategories.map((category, index) => {
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

            {/* Category Info - Updated count to show filtered results */}
            <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-300">
              <MapPin className="w-4 h-4 dark:text-gray-300" />
              <span>
                {filteredProperties.length === category.properties.length 
                  ? `Over ${category.count.toLocaleString()} homes in ${category.location}`
                  : `${filteredProperties.length} of ${category.properties.length} homes shown in ${category.location}`
                }
              </span>
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

            {/* View All Button - Updated to show filtered count */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => handleCategoryClick(category)}
                className="px-8 py-2 bg-background hover:bg-accent dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
                aria-label={`View all properties in ${category.location}`}
              >
                View all {filteredProperties.length} properties in {category.location}
              </Button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function App() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [properties, setProperties] = useState<Property[]>(locationCategories.flatMap((cat) => cat.properties))
  const [showMap, setShowMap] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCategories, setShowCategories] = useState(true)
  const [filters, setFilters] = useState<FilterOptions>({
    location: "",
    propertyType: "",
    priceRange: "",
    bedrooms: "",
  })

  // Memoized filtered properties
  const filteredProperties = useMemo(() => {
    return filterProperties(properties, filters)
  }, [properties, filters])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters)
  }, [])

  const handleLike = (id: string) => {
    setProperties((prev) =>
      prev.map((property) => (property.id === id ? { ...property, isLiked: !property.isLiked } : property))
    )
  }

  const handleCategorySelect = (category: LocationCategory) => {
    setSelectedCategory(category.id)
    setShowCategories(false)
    // Optionally, filter properties for the selected category
    // setProperties(category.properties)
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
    return locationCategories.reduce((total, category) => {
      return total + filterProperties(category.properties, filters).length
    }, 0)
  }, [filters])

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
              { number: "10,000+", label: "Properties", delay: 0 },
              { number: "50+", label: "Cities", delay: 0.1 },
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
      {(filters.location || filters.propertyType || filters.priceRange || filters.bedrooms) && (
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

      {/* Properties Section */}
      {showCategories ? (
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
          />
        </motion.div>
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

      {/* Enhanced Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-white py-20 mt-20 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">P</span>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white">PropertyHub</h3>
                  <p className="text-sm text-gray-400 dark:text-gray-300">Real Estate Marketplace</p>
                </div>
              </div>
              <p className="text-gray-300 dark:text-gray-200 text-sm leading-relaxed">
                Your trusted partner in finding the perfect property across Nigeria. We connect dreams with reality.
              </p>
            </motion.div>

            {[
              {
                title: "Explore",
                links: ["Buy Properties", "Rent Properties", "Commercial Spaces", "Land & Plots"],
              },
              {
                title: "Company",
                links: ["About Us", "Contact", "Careers", "Press"],
              },
              {
                title: "Support",
                links: ["Help Center", "Safety Center", "Community Guidelines", "Terms of Service"],
              },
            ].map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.5 + index * 0.1 }}
              >
                <h4 className="font-semibold text-lg text-white mb-6">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-gray-300 hover:text-white transition-colors text-sm hover:underline dark:text-gray-200 dark:hover:text-gray-50"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="border-t border-gray-700 dark:border-gray-600 mt-16 pt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.8 }}
          >
            <p className="text-gray-400 dark:text-gray-300 text-sm">
              &copy; 2024 PropertyHub. All rights reserved. Made with ❤️ in Nigeria.
            </p>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  )
}