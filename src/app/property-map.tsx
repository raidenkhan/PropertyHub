"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, MapPin, Star, Navigation } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"

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
  coordinates: { lat: number; lng: number }
}

interface PropertyMapProps {
  properties: Property[]
  isOpen: boolean
  onClose: () => void
  selectedCategory?: string
}

// Sample coordinates for Lagos and Abuja properties
const propertiesWithCoordinates: Property[] = [
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
    image: "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=300&h=200&fit=crop",
    coordinates: { lat: 6.4281, lng: 3.4219 },
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
    image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=300&h=200&fit=crop",
    coordinates: { lat: 6.6018, lng: 3.3515 },
  },
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
    image: "https://images.unsplash.com/photo-1675529734325-f735f7a25121?w=300&h=200&fit=crop",
    coordinates: { lat: 6.4698, lng: 3.5852 },
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
    image: "https://images.unsplash.com/photo-1637095937545-7d8c1edf4d2b?w=300&h=200&fit=crop",
    coordinates: { lat: 6.4304, lng: 3.4263 },
  },
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
    image: "https://images.unsplash.com/photo-1601622962666-d0b6d43a7ac7?w=300&h=200&fit=crop",
    coordinates: { lat: 9.0765, lng: 7.4951 },
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
    image: "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=300&h=200&fit=crop",
    coordinates: { lat: 6.455, lng: 3.4348 },
  },
]

export function PropertyMap({ properties, isOpen, onClose, selectedCategory }: PropertyMapProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 6.5244, lng: 3.3792 }) // Lagos center

  useEffect(() => {
    if (selectedCategory) {
      // Adjust map center based on selected category
      if (selectedCategory.includes("abuja")) {
        setMapCenter({ lat: 9.0765, lng: 7.4951 })
      } else {
        setMapCenter({ lat: 6.5244, lng: 3.3792 })
      }
    }
  }, [selectedCategory])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">Property Locations</h2>
              <Badge className="bg-blue-100 text-blue-700">{propertiesWithCoordinates.length} properties</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex h-full">
            {/* Map Area */}
            <div className="flex-1 relative bg-gradient-to-br from-blue-50 to-green-50">
              {/* Simulated Map with Property Markers */}
              <div className="absolute inset-0 p-8">
                <div className="relative w-full h-full bg-slate-100 rounded-xl overflow-hidden">
                  {/* Map Background Pattern */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fillOpacity='0.1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20z'/%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  />

                  {/* Property Markers */}
                  {propertiesWithCoordinates.map((property, index) => {
                    // Convert coordinates to screen positions (simplified)
                    const x = (property.coordinates.lng - 3.0) * 200 + 200
                    const y = (9.5 - property.coordinates.lat) * 150 + 100

                    return (
                      <motion.div
                        key={property.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="absolute cursor-pointer"
                        style={{ left: `${Math.max(0, Math.min(x, 90))}%`, top: `${Math.max(0, Math.min(y, 80))}%` }}
                        onClick={() => setSelectedProperty(property)}
                      >
                        <div className={`relative ${selectedProperty?.id === property.id ? "z-20" : "z-10"}`}>
                          <div
                            className={`bg-white rounded-lg shadow-lg border-2 px-3 py-2 transition-all duration-200 ${
                              selectedProperty?.id === property.id
                                ? "border-blue-500 scale-110"
                                : "border-slate-200 hover:border-blue-300 hover:scale-105"
                            }`}
                          >
                            <div className="text-sm font-semibold text-slate-900">{property.price}</div>
                          </div>

                          {/* Pointer */}
                          <div
                            className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                              selectedProperty?.id === property.id ? "border-t-blue-500" : "border-t-slate-200"
                            }`}
                          />
                        </div>
                      </motion.div>
                    )
                  })}

                  {/* Map Controls */}
                  <div className="absolute top-4 right-4 space-y-2">
                    <Button size="sm" variant="outline" className="bg-white/90 backdrop-blur-sm">
                      <Navigation className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Details Sidebar */}
            <div className="w-96 border-l border-slate-200 bg-slate-50 overflow-y-auto">
              {selectedProperty ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6">
                  <Card className="overflow-hidden">
                    <div className="aspect-video relative">
                      <img
                        src={selectedProperty.image || "/placeholder.svg"}
                        alt={selectedProperty.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-3 left-3 bg-white/90 text-slate-900">
                        {selectedProperty.type}
                      </Badge>
                    </div>

                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 mb-2">{selectedProperty.title}</h3>
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{selectedProperty.location}</span>
                        </div>
                      </div>

                      {(selectedProperty.bedrooms || selectedProperty.bathrooms || selectedProperty.area) && (
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          {selectedProperty.bedrooms && <span>{selectedProperty.bedrooms} bed</span>}
                          {selectedProperty.bathrooms && <span>{selectedProperty.bathrooms} bath</span>}
                          {selectedProperty.area && <span>{selectedProperty.area}</span>}
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium text-slate-700">{selectedProperty.rating}</span>
                        </div>
                        <span className="text-sm text-slate-500">({selectedProperty.reviews} reviews)</span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="text-2xl font-bold text-slate-900">{selectedProperty.price}</span>
                          {selectedProperty.status === "Rent" && <span className="text-sm text-slate-500">/month</span>}
                        </div>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click on a property marker to view details</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
