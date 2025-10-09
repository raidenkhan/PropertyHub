"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, MapPin, Eye, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Property } from '@/types/property'
import { useRouter } from 'next/navigation'

type PropertyWithUniqueKey = Property & { uniqueKey: string }

interface FeaturedPropertiesProps {
  properties: Property[]
  onLike: (id: string) => void
  title?: string
  subtitle?: string
}

export function FeaturedProperties({ 
  properties, 
  onLike, 
  title = "Featured Properties",
  subtitle = "Hand-picked properties just for you"
}: FeaturedPropertiesProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const router = useRouter()

  const featuredProperties = properties.slice(0, 6) // Show max 6 featured properties

  useEffect(() => {
    if (autoPlay && featuredProperties.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1
          return nextIndex >= featuredProperties.length ? 0 : nextIndex
        })
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [autoPlay, featuredProperties.length])

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? featuredProperties.length - 1 : currentIndex - 1)
    setAutoPlay(false)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex === featuredProperties.length - 1 ? 0 : currentIndex + 1)
    setAutoPlay(false)
  }

  if (featuredProperties.length === 0) {
    return null
  }

  // Get current visible properties with unique keys
  const getCurrentProperties = (): PropertyWithUniqueKey[] => {
    const visibleProperties: PropertyWithUniqueKey[] = []
    const totalProperties = featuredProperties.length
    
    for (let i = 0; i < Math.min(3, totalProperties); i++) {
      const index = (currentIndex + i) % totalProperties
      visibleProperties.push({
        ...featuredProperties[index],
        uniqueKey: `${featuredProperties[index].id}-${index}-${i}`
      })
    }
    
    return visibleProperties
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="py-16 px-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          <div className="overflow-hidden rounded-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full"
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getCurrentProperties().map((property, index) => (
                    <motion.div
                      key={property.uniqueKey}
                      className="bg-background rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-border/50 group"
                      whileHover={{ y: -8 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      {/* Property Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={property.images?.[0] || '/placeholder-property.jpg'}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          <Badge className="bg-primary/90 text-primary-foreground text-xs px-2 py-1">
                            Featured
                          </Badge>
                          {property.status === 'Available' && (
                            <Badge variant="secondary" className="bg-green-500/90 text-white text-xs px-2 py-1">
                              Available
                            </Badge>
                          )}
                        </div>

                        {/* Like Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-4 right-4 w-8 h-8 p-0 bg-background/80 hover:bg-background/90 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            onLike(property.id)
                          }}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              property.isLiked 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-muted-foreground hover:text-red-500'
                            }`}
                          />
                        </Button>

                        {/* Quick Stats */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1">
                          <Eye className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {Math.floor(Math.random() * 100) + 50} views
                          </span>
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2">
                            {property.title}
                          </h3>
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">{property.location}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-2xl font-bold text-primary">
                              {property.price}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {property.bedrooms && (
                                <span>{property.bedrooms} beds</span>
                              )}
                              {property.bathrooms && (
                                <span>{property.bathrooms} baths</span>
                              )}
                              {property.area && (
                                <span>{property.area} sqft</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {(Math.random() * 2 + 3).toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <Button
                          className="w-full mt-4 rounded-xl"
                          onClick={() => router.push(`/property/${property.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          {featuredProperties.length > 3 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 p-0 bg-background/80 hover:bg-background/90 rounded-full shadow-md"
                onClick={goToPrevious}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 p-0 bg-background/80 hover:bg-background/90 rounded-full shadow-md"
                onClick={goToNext}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          {/* Dots Indicator */}
          {featuredProperties.length > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: Math.ceil(featuredProperties.length / 3) }).map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    Math.floor(currentIndex / 3) === index
                      ? 'bg-primary w-6'
                      : 'bg-muted-foreground/30'
                  }`}
                  onClick={() => {
                    setCurrentIndex(index * 3)
                    setAutoPlay(false)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}