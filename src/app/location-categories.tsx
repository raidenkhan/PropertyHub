"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { MapPin, TrendingUp, Clock, Star } from "lucide-react"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
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

interface LocationCategoriesProps {
  onCategorySelect: (category: LocationCategory) => void
  onLike: (id: string) => void
  viewMode: "grid" | "list"
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
        id: "vi-1",
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
        image: "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=400&h=300&fit=crop",
        isLiked: false,
      },
      {
        id: "vi-2",
        title: "Executive Office Space in VI",
        location: "Victoria Island, Lagos",
        price: "₦3,500,000",
        type: "Office",
        status: "Rent",
        area: "200sqm",
        rating: 4.7,
        reviews: 15,
        image: "https://images.unsplash.com/photo-1637095937545-f735f7a25121?w=400&h=300&fit=crop",
        isLiked: false,
      },
      {
        id: "vi-3",
        title: "Luxury Penthouse with Ocean View",
        location: "Victoria Island, Lagos",
        price: "₦15,000,000",
        type: "Apartment",
        status: "Available",
        bedrooms: 4,
        bathrooms: 3,
        area: "280sqm",
        rating: 4.9,
        reviews: 42,
        image: "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=400&h=300&fit=crop",
        isLiked: true,
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
        id: "lekki-1",
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
        image: "https://images.unsplash.com/photo-1675529734325-f735f7a25121?w=400&h=300&fit=crop",
        isLiked: false,
      },
      {
        id: "lekki-2",
        title: "Modern 4BR Duplex with Pool",
        location: "Lekki Phase 1, Lagos",
        price: "₦28,000,000",
        type: "House",
        status: "Available",
        bedrooms: 4,
        bathrooms: 3,
        area: "250sqm",
        rating: 4.6,
        reviews: 18,
        image: "https://images.unsplash.com/photo-1601622962666-d0b6d43a7ac7?w=400&h=300&fit=crop",
        isLiked: false,
      },
      {
        id: "lekki-3",
        title: "Contemporary 3BR Terrace",
        location: "Lekki Phase 1, Lagos",
        price: "₦18,500,000",
        type: "House",
        status: "Available",
        bedrooms: 3,
        bathrooms: 2,
        area: "180sqm",
        rating: 4.7,
        reviews: 25,
        image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=300&fit=crop",
        isLiked: true,
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
        id: "maitama-1",
        title: "Premium Land Plot in Abuja",
        location: "Maitama, Abuja",
        price: "₦25,000,000",
        type: "Land",
        status: "Available",
        area: "1000sqm",
        rating: 4.5,
        reviews: 8,
        image: "https://images.unsplash.com/photo-1601622962666-d0b6d43a7ac7?w=400&h=300&fit=crop",
        isLiked: true,
      },
      {
        id: "maitama-2",
        title: "Diplomatic Zone Mansion",
        location: "Maitama, Abuja",
        price: "₦85,000,000",
        type: "House",
        status: "Available",
        bedrooms: 6,
        bathrooms: 5,
        area: "500sqm",
        rating: 4.8,
        reviews: 12,
        image: "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=400&h=300&fit=crop",
        isLiked: false,
      },
      {
        id: "maitama-3",
        title: "Executive 4BR Apartment",
        location: "Maitama, Abuja",
        price: "₦12,000,000",
        type: "Apartment",
        status: "Available",
        bedrooms: 4,
        bathrooms: 3,
        area: "220sqm",
        rating: 4.6,
        reviews: 16,
        image: "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=400&h=300&fit=crop",
        isLiked: false,
      },
    ],
  },
]

export function LocationCategories({ onCategorySelect, onLike, viewMode }: LocationCategoriesProps) {
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
    <div className="space-y-12">
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
              <h2 className="text-2xl font-bold text-slate-900">{category.title}</h2>

              {/* Category Badges */}
              <div className="flex items-center gap-2">
                {category.trending && (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}
                {category.recent && (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <Clock className="w-3 h-3 mr-1" />
                    New
                  </Badge>
                )}
                {category.popular && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
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
              className="flex items-center gap-2 hover:bg-slate-50 bg-transparent"
            >
              <MapPin className="w-4 h-4" />
              Show on map
            </Button>
          </div>

          {/* Category Info */}
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-4 h-4" />
            <span>
              Over {category.count.toLocaleString()} homes in {category.location}
            </span>
          </div>

          <motion.div
            className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
            layout
          >
            {category.properties.map((property, propertyIndex) => (
              <PropertyCard
                key={property.id}
                {...property}
                onLike={onLike}
                delay={propertyIndex * 0.1}
                viewMode={viewMode}
              />
            ))}
          </motion.div>

          {/* View All Button */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => handleCategoryClick(category)}
              className="px-8 py-2 hover:bg-slate-50"
            >
              View all {category.count.toLocaleString()} properties in {category.location}
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
