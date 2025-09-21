"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Grid3X3, List, Search, MapPin, TrendingUp, Clock, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PropertyCard } from "@/components/PropertyCard"
import { motion } from "framer-motion"

interface Property {
  id: string
  title: string
  location: string
  price: string
  priceUnit?: string
  type?: string
  rating: number
  reviews: number
  image: string
  beds?: number
  baths?: number
  sqm?: number
  status: "Available" | "Sold" | "Rent" | "Commercial" | "House"
  coordinates: { lat: number; lng: number }
  viewMode?: "grid" | "list"
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
        rating: 4.8,
        reviews: 24,
        image: "/modern-apartment-building.png",
        beds: 3,
        baths: 2,
        sqm: 120,
        status: "Available",
        coordinates: { lat: 6.4281, lng: 3.4219 },
      },
      {
        id: "5",
        title: "Executive Office Space in Ikoyi",
        location: "Ikoyi, Lagos",
        price: "₦3,500,000",
        priceUnit: "/month",
        rating: 4.7,
        reviews: 22,
        image: "/executive-office-space.jpg",
        sqm: 150,
        status: "Commercial",
        coordinates: { lat: 6.4541, lng: 3.4316 },
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
        rating: 4.9,
        reviews: 31,
        image: "/luxury-detached-house.jpg",
        beds: 5,
        baths: 4,
        sqm: 350,
        status: "House",
        coordinates: { lat: 6.4698, lng: 3.5852 },
      },
      {
        id: "4",
        title: "Cozy 2BR Apartment in Surulere",
        location: "Surulere, Lagos",
        price: "₦1,800,000",
        rating: 4.5,
        reviews: 12,
        image: "/cozy-apartment-interior.jpg",
        beds: 2,
        baths: 2,
        sqm: 95,
        status: "Available",
        coordinates: { lat: 6.4969, lng: 3.3534 },
      },
    ],
  },
  {
    id: "lagos-gbagada",
    title: "Available in Gbagada",
    location: "Gbagada, Lagos",
    count: 320,
    recent: true,
    properties: [
      {
        id: "6",
        title: "Family Home in Gbagada",
        location: "Gbagada, Lagos",
        price: "₦25,000,000",
        rating: 4.4,
        reviews: 8,
        image: "/modern-family-house.png",
        beds: 4,
        baths: 3,
        sqm: 280,
        status: "House",
        coordinates: { lat: 6.5244, lng: 3.3792 },
      },
      {
        id: "2",
        title: "Prime Commercial Shop Space in Ikeja",
        location: "Ikeja, Lagos",
        price: "₦1,200,000",
        priceUnit: "/month",
        rating: 4.6,
        reviews: 18,
        image: "/commercial-office-space.png",
        sqm: 85,
        status: "Commercial",
        coordinates: { lat: 6.6018, lng: 3.3515 },
      },
    ],
  },
]

// Map category titles to location strings for filtering
const categoryLocationMap: { [key: string]: string } = {
  "Popular homes in Victoria Island": "Victoria Island, Lagos",
  "Trending in Lekki Phase 1": "Lekki Phase 1, Lagos",
  "Available in Gbagada": "Gbagada, Lagos",
  "All Properties": "All Properties",
}

function LocationCategories({
  onCategorySelect,
  onPropertyClick,
  viewMode,
}: {
  onCategorySelect: (category: LocationCategory) => void
  onPropertyClick: (property: Property) => void
  viewMode: "grid" | "list"
}) {
  const router = useRouter()

  const handleCategoryClick = (category: LocationCategory) => {
    onCategorySelect(category)
    router.push(`/map?category=${encodeURIComponent(category.title)}`)
  }

  const handleShowOnMap = (category: LocationCategory) => {
    router.push(`/map?category=${encodeURIComponent(category.title)}`)
  }

  return (
    <div className="space-y-12 px-6">
      {locationCategories.map((category, index) => (
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

          {/* Category Info */}
          <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-300">
            <MapPin className="w-4 h-4 dark:text-gray-300" />
            <span>
              Over {category.count.toLocaleString()} homes in {category.location}
            </span>
          </div>

          <motion.div
            className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
            layout
          >
            {category.properties.map((property, propertyIndex) => (
              <div
                key={property.id}
                className={`cursor-pointer transition-all duration-200`}
                onClick={() => onPropertyClick(property)}
              >
                <PropertyCard
                  {...property}
                  status={property.status}
                  viewMode={viewMode}
                  delay={propertyIndex * 0.1}
                />
              </div>
            ))}
          </motion.div>

          {/* View All Button */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => handleCategoryClick(category)}
              className="px-8 py-2 bg-background hover:bg-accent dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
              aria-label={`View all properties in ${category.location}`}
            >
              View all {category.count.toLocaleString()} properties in {category.location}
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function MapPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const category = searchParams.get("category") || "All Properties"

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [mapLoaded, setMapLoaded] = useState(false)

  // Resolve category to location for filtering
  const resolvedLocation = categoryLocationMap[category] || category

  // Filter properties based on search query and resolved location
  
  const filteredProperties = locationCategories
    .flatMap((cat) => cat.properties)
    .filter(
      (property) =>
        (resolvedLocation === "All Properties" || property.location === resolvedLocation)
      // &&
        //(property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         //property.location.toLowerCase().includes(searchQuery.toLowerCase()))
    )

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setMapLoaded(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property)
  }

  const handleMarkerClick = (property: Property) => {
    setSelectedProperty(property)
  }

  const handleCategorySelect = (category: LocationCategory) => {
    router.push(`/map?category=${encodeURIComponent(category.title)}`)
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      {/* Header */}
      <div className="bg-background border-b border-border dark:bg-gray-800 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-foreground dark:text-gray-300"
              >
                <ArrowLeft className="h-4 w-4 dark:text-gray-300" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground dark:text-white">{category}</h1>
                <p className="text-sm text-muted-foreground dark:text-gray-300">{filteredProperties.length} properties found</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-300" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-background dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Properties Sidebar */}
        <div className="w-1/2 bg-background border-r border-border dark:bg-gray-800 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {category === "All Properties" ? (
              <LocationCategories
                onCategorySelect={handleCategorySelect}
                onPropertyClick={handlePropertyClick}
                viewMode={viewMode}
              />
            ) : (
              <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1" : "grid-cols-1"}`}>
                {filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedProperty?.id === property.id ? "ring-2 ring-blue-500 ring-offset-2" : "hover:shadow-lg"
                    }`}
                    onClick={() => handlePropertyClick(property)}
                  >
                    <PropertyCard
                      //status={property.status} //use actual status
                      {...property}
                      viewMode={viewMode}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map Section */}
        <div className="w-1/2 relative">
          {!mapLoaded ? (
            <div className="absolute inset-0 bg-background dark:bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground dark:text-gray-300">Loading map...</p>
              </div>
            </div>
          ) : (
            <div className="h-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
              {/* Map Background */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-gradient-to-br from-green-200 via-blue-200 to-purple-200 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800"></div>
              </div>

              {/* Property Markers */}
              {filteredProperties.map((property, index) => (
                <div
                  key={property.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                    selectedProperty?.id === property.id ? "z-20 scale-110" : "z-10"
                  }`}
                  style={{
                    left: `${20 + ((index * 15) % 60)}%`,
                    top: `${20 + ((index * 12) % 60)}%`,
                  }}
                  onClick={() => handleMarkerClick(property)}
                >
                  <div
                    className={`bg-background rounded-lg shadow-lg border-2 px-3 py-2 dark:bg-gray-800 dark:border-gray-700 ${
                      selectedProperty?.id === property.id
                        ? "border-blue-500 shadow-xl"
                        : "border-border hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-400"
                    }`}
                  >
                    <div className="text-sm font-semibold text-foreground dark:text-white">
                      {property.price}
                      {property.priceUnit && <span className="text-xs text-muted-foreground dark:text-gray-300">{property.priceUnit}</span>}
                    </div>
                  </div>

                  {/* Marker Pin */}
                  <div
                    className={`w-3 h-3 rounded-full mx-auto mt-1 ${
                      selectedProperty?.id === property.id ? "bg-blue-500" : "bg-slate-400 dark:bg-gray-300"
                    }`}
                  ></div>
                </div>
              ))}

              {/* Map Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-background dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                >
                  +
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-background dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                >
                  -
                </Button>
              </div>

              {/* Selected Property Details */}
              {selectedProperty && (
                <div className="absolute bottom-4 left-4 right-4 bg-background rounded-lg shadow-xl border border-border dark:bg-gray-800 dark:border-gray-700 p-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={selectedProperty.image || "/placeholder.svg"}
                      alt={selectedProperty.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground dark:text-white mb-1">{selectedProperty.title}</h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-300 mb-2">{selectedProperty.location}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-300">
                          {selectedProperty.beds && <span>{selectedProperty.beds} bed</span>}
                          {selectedProperty.baths && <span>{selectedProperty.baths} bath</span>}
                          {selectedProperty.sqm && <span>{selectedProperty.sqm}sqm</span>}
                        </div>
                        <div className="text-lg font-bold text-foreground dark:text-white">
                          {selectedProperty.price}
                          {selectedProperty.priceUnit && (
                            <span className="text-sm text-muted-foreground dark:text-gray-300">{selectedProperty.priceUnit}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}