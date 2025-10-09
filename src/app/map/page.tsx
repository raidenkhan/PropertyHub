// src/app/map/page.tsx
"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Grid3X3, List, Search, MapPin, TrendingUp, Clock, Star, X, Filter, SortAsc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PropertyCard } from "@/components/PropertyCard"
import { motion } from "framer-motion"
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { ResponsiveLocationButton, CategoryLocationDisplay } from "@/components/ui/responsive-text"
import { propertyService } from "@/lib/api/propertyService"
import { convertPropertyData, groupPropertiesByLocationClusters } from "@/lib/utils"



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


function LocationCategories({
  onCategorySelect,
  onPropertyClick,
  viewMode,
  categories,
  loading,
  error,
}: {
  onCategorySelect: (category: LocationCategory) => void
  onPropertyClick: (property: Property) => void
  viewMode: "grid" | "list"
  categories: LocationCategory[]
  loading: boolean
  error: string | null
}) {
  const router = useRouter()

  const handleCategoryClick = (category: LocationCategory) => {
    onCategorySelect(category)
    router.push(`/map?category=${encodeURIComponent(category.title)}`)
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
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary"></div>
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
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
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
      {categories.map((category, index) => (
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
            <CategoryLocationDisplay 
              location={category.location}
              count={category.count}
            />
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

          {/* View All Button - Using ResponsiveLocationButton */}
          <div className="text-center">
            <ResponsiveLocationButton
              locationText={category.location}
              propertyCount={category.count.toLocaleString()}
              onClick={() => handleCategoryClick(category)}
              className="bg-background hover:bg-accent dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
            />
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
      // Only auto-switch if user hasn't explicitly chosen a view mode
      const isMobile = window.innerWidth < 768
      if (isMobile && viewMode === "grid") {
        setViewMode("list")
      } else if (!isMobile && viewMode === "list" && window.innerWidth > 1024) {
        // Only switch to grid on larger screens
        setViewMode("grid")
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<{[key: string]: mapboxgl.Marker}>({})
  
  // State for dynamic categories and properties
  const [categories, setCategories] = useState<LocationCategory[]>([])
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
        
        // Convert mixed data format to unified structure
        const { categories: convertedCategories, allProperties: convertedProperties } = 
          convertPropertyData(apiData)
        
        // Generate clustered categories for location-based sorting
        const clustered = groupPropertiesByLocationClusters(convertedProperties)
        setCategories(clustered)
        setAllProperties(convertedProperties)
        
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

  // Filter properties based on search query and selected category
  const filteredProperties = useMemo(() => {
    if (loading || !allProperties.length) return []
    
    if (category === "All Properties") {
      return allProperties.filter(property => 
        !searchQuery || property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Find the category that matches the selected one
    const selectedCategory = categories.find(cat => cat.title === category)
    if (!selectedCategory) return []
    
    return selectedCategory.properties.filter(property => 
      !searchQuery || property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [allProperties, categories, category, searchQuery, loading])

useEffect(() => {
  if (typeof window === 'undefined' || loading) return

  // Initialize map
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

  if (!map.current && mapContainer.current) {
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [7.4951, 9.0765], // Default to Nigeria center
      zoom: 6,
      attributionControl: false
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(new mapboxgl.AttributionControl({
      compact: true
    }), 'bottom-left')
  }

  // Add markers when map is loaded and we have properties
  const addMarkers = () => {
    if (!map.current || filteredProperties.length === 0) return
    
    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove())
    markers.current = {}

    console.log('Adding markers for', filteredProperties.length, 'properties')

    // Group properties by location for clustering (Airbnb style)
    const locationGroups = new Map<string, Property[]>()
    
    filteredProperties.forEach(property => {
      const locationKey = `${Math.round(property.coordinates.lat * 100) / 100}_${Math.round(property.coordinates.lng * 100) / 100}`
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, [])
      }
      locationGroups.get(locationKey)!.push(property)
    })

    // Create Airbnb-style markers for each location group
    locationGroups.forEach((properties, locationKey) => {
      const firstProperty = properties[0]
      const propertyCount = properties.length
      
      // Create marker element
      const el = document.createElement('div')
      el.className = 'airbnb-marker'
      
      // Check if any property in this group is selected
      const isSelected = properties.some(p => p.id === selectedProperty?.id)
      
      el.innerHTML = `
        <div class="airbnb-marker-inner ${
          isSelected ? 'selected' : ''
        }">
          <span class="marker-text">${propertyCount > 1 ? propertyCount : firstProperty.price}</span>
        </div>
      `
      
      // Add styles
      el.style.cssText = `
        cursor: pointer;
        transform: translate(-50%, -50%);
      `
      
      // Add marker styles to the page if not already added
      if (!document.getElementById('airbnb-marker-styles')) {
        const styleSheet = document.createElement('style')
        styleSheet.id = 'airbnb-marker-styles'
        styleSheet.textContent = `
          .airbnb-marker-inner {
            background-color: #0070f3;
            border: 1px solid #0070f3;
            border-radius: 20px;
            padding: 6px 12px;
            font-weight: 600;
            font-size: 14px;
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(0,112,243,0.3);
            transition: all 0.2s ease;
            white-space: nowrap;
          }
          .airbnb-marker-inner:hover {
            background-color: #0051cc;
            border-color: #0051cc;
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0,112,243,0.4);
          }
          .airbnb-marker-inner.selected {
            background-color: #222222;
            color: #ffffff;
            border-color: #222222;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          .marker-text {
            font-size: 13px;
            font-weight: 600;
          }
          .airbnb-popup .mapboxgl-popup-content {
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            border: none;
            max-width: 320px;
          }
          .airbnb-popup .mapboxgl-popup-tip {
            border-top-color: #ffffff;
          }
          .property-preview:hover {
            background-color: #f8f9fa !important;
          }
        `
        document.head.appendChild(styleSheet)
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([firstProperty.coordinates.lng, firstProperty.coordinates.lat])
        .setPopup(
          new mapboxgl.Popup({ 
            offset: 25,
            closeButton: false,
            closeOnClick: false,
            className: 'airbnb-popup'
          })
          .setHTML(`
            <div class="p-4 max-w-xs">
              ${propertyCount > 1 ? 
                `<h4 class="font-semibold mb-3 text-gray-900">${propertyCount} Properties Available</h4>
                 <div class="space-y-2 max-h-40 overflow-y-auto">
                   ${properties.slice(0, 3).map(property => `
                     <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer property-preview" data-property-id="${property.id}">
                       <img src="${property.image}" alt="${property.title}" class="w-12 h-12 rounded object-cover flex-shrink-0" />
                       <div class="min-w-0">
                         <h5 class="font-medium text-sm truncate text-gray-900">${property.title}</h5>
                         <p class="text-xs text-gray-600 truncate">${property.location}</p>
                         <p class="text-sm font-semibold text-gray-900">${property.price}</p>
                       </div>
                     </div>
                   `).join('')}
                   ${propertyCount > 3 ? `
                     <div class="text-center pt-2 border-t">
                       <span class="text-sm text-blue-600 font-medium">+${propertyCount - 3} more properties</span>
                     </div>
                   ` : ''}
                 </div>`
                :
                `<div class="flex items-start gap-3">
                   <img src="${firstProperty.image}" alt="${firstProperty.title}" class="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                   <div class="min-w-0">
                     <h4 class="font-semibold mb-1 text-gray-900">${firstProperty.title}</h4>
                     <p class="text-sm text-gray-600 mb-2">${firstProperty.location}</p>
                     <div class="flex items-center justify-between mb-2">
                       <div class="text-sm text-gray-500">
                         ${firstProperty.bedrooms ? `${firstProperty.bedrooms} bed` : ''}
                         ${firstProperty.bathrooms ? ` • ${firstProperty.bathrooms} bath` : ''}
                       </div>
                     </div>
                     <p class="text-lg font-bold text-gray-900">${firstProperty.price}</p>
                   </div>
                 </div>`
              }
            </div>
          `)
        )
        .addTo(map.current!)

      // Store all properties for this marker
      properties.forEach(property => {
        markers.current[property.id] = marker
      })

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        if (propertyCount === 1) {
          setSelectedProperty(firstProperty)
          // Fly to property
          map.current?.flyTo({
            center: [firstProperty.coordinates.lng, firstProperty.coordinates.lat],
            zoom: 16,
            essential: true
          })
        } else {
          // For multiple properties, just center on the location
          map.current?.flyTo({
            center: [firstProperty.coordinates.lng, firstProperty.coordinates.lat],
            zoom: 15,
            essential: true
          })
          
          // Show popup with property list
          marker.getPopup()?.addTo(map.current!)
        }
      })
      
      // Add click handlers for individual properties in popup
      marker.getPopup()?.on('open', () => {
        const propertyPreviews = document.querySelectorAll('.property-preview')
        propertyPreviews.forEach(preview => {
          preview.addEventListener('click', (e) => {
            const propertyId = (e.currentTarget as HTMLElement).dataset.propertyId
            const selectedProp = properties.find(p => p.id === propertyId)
            if (selectedProp) {
              setSelectedProperty(selectedProp)
              marker.getPopup()?.remove()
            }
          })
        })
      })
    })

    // Fit bounds to show all properties
    if (filteredProperties.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      filteredProperties.forEach(property => {
        bounds.extend([property.coordinates.lng, property.coordinates.lat])
      })
      map?.current?.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 12
      })
    } else if (category !== "All Properties") {
      // Find the selected category and fly to its first property
      const categoryObj = categories.find(cat => cat.title === category)
      if (categoryObj && categoryObj.properties.length > 0) {
        const firstProperty = categoryObj.properties[0]
        map?.current?.flyTo({
          center: [firstProperty.coordinates.lng, firstProperty.coordinates.lat],
          zoom: 12,
          essential: true
        })
      }
    }
  }

  if (map.current?.isStyleLoaded()) {
    addMarkers()
  } else {
    map.current?.on('load', addMarkers)
  }

  return () => {
    if (map.current) {
      map.current.off('load', addMarkers)
    }
  }
}, [category, selectedProperty, filteredProperties, loading])

  // Update markers when selected property changes
useEffect(() => {
  // Update all marker styles to default
  Object.values(markers.current).forEach(marker => {
    const el = marker.getElement()
    const innerDiv = el.querySelector('.airbnb-marker-inner')
    if (innerDiv) {
      innerDiv.classList.remove('selected')
    }
  })

  // Highlight selected property marker
  if (selectedProperty && markers.current[selectedProperty.id]) {
    const el = markers.current[selectedProperty.id].getElement()
    const innerDiv = el.querySelector('.airbnb-marker-inner')
    if (innerDiv) {
      innerDiv.classList.add('selected')
    }
    
    // Center map on selected property
    map.current?.flyTo({
      center: [selectedProperty.coordinates.lng, selectedProperty.coordinates.lat],
      zoom: 16,
      essential: true
    })
  }
}, [selectedProperty, category])

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property)
  }

  const handleCategorySelect = (category: LocationCategory) => {
    router.push(`/map?category=${encodeURIComponent(category.title)}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Mobile Header */}
          <div className="flex flex-col space-y-3 py-3 sm:hidden">
            {/* Top Row - Back Button & Title */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 px-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium text-sm">Back</span>
              </Button>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[140px]">
                    {category === "All Properties" ? "Explore Properties" : category}
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Mobile View Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={`px-2 py-1 rounded-sm transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={`px-2 py-1 rounded-sm transition-all duration-200 ${
                      viewMode === "list"
                        ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Second Row - Stats */}
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  {loading ? 'Loading...' : `${filteredProperties.length} properties`}
                </span>
                {!loading && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span>Updated 2 min ago</span>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1 h-auto"
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Filters</span>
              </Button>
            </div>
            
            {/* Third Row - Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search properties or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg shadow-sm text-sm w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Desktop/Tablet Header */}
          <div className="hidden sm:flex flex-col lg:flex-row items-start lg:items-center justify-between py-4 gap-4">
            {/* Left Section - Navigation & Title */}
            <div className="flex items-center gap-4 w-full lg:w-auto min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Back to Properties</span>
              </Button>
              
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight truncate">
                    {category === "All Properties" ? "Explore Properties" : category}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      {loading ? 'Loading...' : `${filteredProperties.length} properties`}
                    </span>
                    {!loading && (
                      <>
                        <span className="text-gray-400 hidden sm:inline">•</span>
                        <span className="hidden sm:inline">Updated 2 min ago</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Search & Controls */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* Enhanced Search */}
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by property name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl shadow-sm text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-md transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-md transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Filters */}
              <div className="hidden xl:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex-shrink-0"
                >
                  Price
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex-shrink-0"
                >
                  Type
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col xl:flex-row min-h-[calc(100vh-6rem)]">
        {/* Enhanced Properties Section */}
        <div className="w-full xl:w-2/5 bg-white dark:bg-gray-900 border-b xl:border-b-0 xl:border-r border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
          {/* Properties Header with Stats */}
          {!loading && (
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Properties</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Filters
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <SortAsc className="h-4 w-4 mr-1" />
                    Sort
                  </Button>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{filteredProperties.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Available</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredProperties.filter(p => p.status === 'Available').length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">For Sale</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(filteredProperties.reduce((acc, p) => acc + p.rating, 0) / filteredProperties.length * 10) / 10 || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Avg Rating</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Properties List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500/30 border-t-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Finding properties...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Please wait while we load the latest listings</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">We couldn't load the properties. Please try again.</p>
                  <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No properties found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search or browse all available properties.</p>
                  <Button 
                    onClick={() => {
                      setSearchQuery('')
                      router.push('/map?category=All%20Properties')
                    }} 
                    variant="outline"
                  >
                    Browse All Properties
                  </Button>
                </div>
              </div>
            ) : category === "All Properties" ? (
              <div className="p-6">
                <LocationCategories
                  onCategorySelect={handleCategorySelect}
                  onPropertyClick={handlePropertyClick}
                  viewMode={viewMode}
                  categories={categories}
                  loading={loading}
                  error={error}
                />
              </div>
            ) : (
              <div className="p-6">
                <div className={`grid gap-6 ${
                  viewMode === "grid" 
                    ? "grid-cols-1" 
                    : "grid-cols-1"
                }`}>
                  {filteredProperties.map((property, index) => (
                    <div
                      key={property.id}
                      className={`group cursor-pointer transition-all duration-300 ${
                        selectedProperty?.id === property.id 
                          ? "ring-2 ring-blue-500 ring-offset-2 shadow-lg" 
                          : "hover:shadow-lg hover:-translate-y-1"
                      }`}
                      onClick={() => handlePropertyClick(property)}
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <PropertyCard
                          {...property}
                          viewMode={viewMode}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Load More Button */}
                {filteredProperties.length > 0 && (
                  <div className="text-center mt-8 pb-6">
                    <Button variant="outline" className="border-gray-200 dark:border-gray-700">
                      Load More Properties
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Map Section */}
        <div className="w-full xl:w-3/5 relative bg-gray-100 dark:bg-gray-800">
          {/* Map Controls Overlay */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Map View</span>
              </div>
              {!loading && (
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-900"
              >
                Satellite
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                Street View
              </Button>
            </div>
          </div>

          {/* Map Container */}
          <div ref={mapContainer} className="h-full min-h-[400px] xl:min-h-[600px]" />
          
          {/* Map Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500/30 border-t-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading map...</p>
              </div>
            </div>
          )}
          
          {/* Enhanced Selected Property Details */}
          {selectedProperty && (
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden backdrop-blur-md">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={selectedProperty.image || "/placeholder.svg"}
                        alt={selectedProperty.title}
                        className="w-20 h-20 rounded-xl object-cover shadow-md"
                      />
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        {selectedProperty.status}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {selectedProperty.title}
                          </h3>
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mt-1">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm truncate">{selectedProperty.location}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedProperty(null)}
                          className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          {selectedProperty.bedrooms && (
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              {selectedProperty.bedrooms} bed
                            </span>
                          )}
                          {selectedProperty.bathrooms && (
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              {selectedProperty.bathrooms} bath
                            </span>
                          )}
                          {selectedProperty.area && (
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              {selectedProperty.area}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedProperty.price}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{selectedProperty.rating}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => router.push(`/property/${selectedProperty.id}`)}
                        >
                          View Details
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-200 dark:border-gray-700">
                          Save
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-200 dark:border-gray-700">
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-lg p-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <div className="text-xs font-medium text-gray-900 dark:text-white mb-2">Legend</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span>Sold</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}