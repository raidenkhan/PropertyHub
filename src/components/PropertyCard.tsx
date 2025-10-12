"use client"

import { Heart, MapPin, Star, Eye, MessageCircle, Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { propertyLikesService } from "@/lib/api/propertyLikesService"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/authContext"
import { useWishlist } from "@/lib/hooks/useWishlist"
import { PropertyCardProps } from "@/types/property"

export function PropertyCard(props: PropertyCardProps) {
  const {
    id,
    propertyId,
    title,
    location,
    price,
    type = "Property", // Default type if not provided
    status,
    bedrooms,
    bathrooms,
    area,
    rating,
    reviews,
    images,
    image,
    isLiked = false,
    likesCount = 0,
    onLike,
    delay = 0,
    viewMode = "grid",
    description,
    amenities,
    specifications,
    currentOwner,
    isVerified,
    coordinates,
  } = props;
  const router = useRouter()
  const { user } = useAuth()
  const { refreshWishlistCount } = useWishlist()
  const [liked, setLiked] = useState(isLiked)
  const [likes, setLikes] = useState(likesCount)
  const [isLiking, setIsLiking] = useState(false)
  // Handle like/unlike functionality
  
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      toast({
        title: "🔐 Authentication Required",
        description: "Please log in to like properties",
      })
      router.push('/auth')
      return
    }
    
    if (isLiking) return
    
    try {
      setIsLiking(true)
      
      // Optimistic update
      const newLiked = !liked
      const newLikes = newLiked ? likes + 1 : likes - 1
      
      setLiked(newLiked)
      setLikes(newLikes)
      
      // Call API - use propertyId if available, otherwise fallback to id
      const idToUse = propertyId || id
      const result = await propertyLikesService.toggleLike(idToUse)
      
      // Update with actual result
      setLiked(result.liked)
      setLikes(result.likesCount)
      
      // Call parent onLike if provided
      onLike?.(id)
      
      // Refresh wishlist count in header
      refreshWishlistCount()
      
      // Show success toast
      toast({
        title: result.liked ? "❤️ Added to Wishlist" : "💔 Removed from Wishlist",
        description: result.liked 
          ? "Property saved to your wishlist" 
          : "Property removed from your wishlist",
      })
      
    } catch (error) {
      // Revert optimistic update on error
      setLiked(liked)
      setLikes(likes)
      
      console.error('Failed to toggle like:', error)
      
      // Handle different error types gracefully
      let errorMessage = "Failed to update wishlist. Please try again."
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMessage = "Wishlist feature is not yet available. Please try again later."
        } else if (error.message.includes('Authentication expired')) {
          errorMessage = "Please log in to save properties to your wishlist."
        }
      }
      
      toast({
        title: "❌ Error",
        description: errorMessage,
      })
    } finally {
      setIsLiking(false)
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
      case "Sold":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
      case "Rent":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
    }
  }
  const handleViewDetails = () => {
    router.push(`/property/${id}`)
  }
  if (viewMode === "list") {
    // List view - horizontal layout for desktop
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ y: -2 }}
        className="group w-full"
      >
        <Link href={`/property/${propertyId}`} className="block">
          <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 h-full">
            <div className="flex flex-row h-full min-h-[140px] sm:min-h-[180px]">
              {/* Image Container */}
              <div className="relative w-1/3 flex-shrink-0">
                <img
                  src={images?.[0] || image || "/placeholder.svg"}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 absolute inset-0"
                  onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
                  loading="lazy"
                />
                {/* Status and Property Type Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {status && (
                    <Badge className={`text-xs px-2 py-1 font-medium ${getStatusColor(status)}`}>
                      {status}
                    </Badge>
                  )}
                  {type && (
                    <Badge variant="secondary" className="text-xs px-2 py-1 bg-background/90 text-foreground">
                      {type}
                    </Badge>
                  )}
                  {isVerified && (
                    <Badge className="text-xs px-2 py-1 bg-primary/90 text-primary-foreground">
                      ✓ Verified
                    </Badge>
                  )}
                </div>

                {/* Enhanced Like Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-3 right-3 w-9 h-9 bg-background/90 backdrop-blur-sm hover:bg-background transition-all duration-200 rounded-full shadow-lg group"
                  onClick={handleLike}
                  disabled={isLiking}
                  aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                >
                  {isLiking ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Heart
                      className={`w-4 h-4 transition-all duration-200 group-hover:scale-110 ${
                        liked 
                          ? "fill-red-500 text-red-500" 
                          : "text-muted-foreground group-hover:text-red-500"
                      }`}
                    />
                  )}
                </Button>
                
                {/* Quick Stats */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/70 text-white backdrop-blur-sm rounded-full px-2 py-1 text-xs">
                  <Eye className="w-3 h-3" />
                  <span>{Math.floor(Math.random() * 100) + 50}</span>
                </div>
              </div>

              {/* Content Container */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Title and Location */}
                  <div>
                    <h3 className="font-semibold text-xl text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {title}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mt-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-base">{location}</span>
                    </div>
                  </div>

                  {/* Property Details & Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300 text-sm">
                      {bedrooms && <span>{bedrooms} beds</span>}
                      {bathrooms && <span>{bathrooms} baths</span>}
                      {area && <span>{area}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-foreground text-sm">{rating}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">({reviews})</span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="font-bold text-2xl text-foreground">{price}</span>
                    {status === "Rent" && <span className="text-base text-gray-500 dark:text-gray-400"> /month</span>}
                  </div>
                  <div className="flex gap-2">
                    <Badge className={`${getStatusColor(status)} text-xs`}>{status}</Badge>
                    {type && <Badge variant="secondary" className="text-xs">{type}</Badge>}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>
    )
  }

  // Grid view - Mobile-first optimized design
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2 }}
      className="group w-full"
    >
      <Link href={`/property/${propertyId}`} className="block">
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-800">
          {/* Image Container - Optimized aspect ratio for mobile */}
          <div className="relative">
            <div className="aspect-[3/2] sm:aspect-[4/3] w-full">
              <img
                src={images?.[0] || image || "/placeholder.svg"}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
                loading="lazy"
              />
            </div>
            
            {/* Status Badge - Better positioned */}
            <Badge
              className={`absolute top-2 left-2 ${getStatusColor(status)} text-xs px-2 py-1 font-medium backdrop-blur-sm border-0 shadow-sm`}
            >
              {status}
            </Badge>
            
            {/* Enhanced Like Button - Larger touch target */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 w-10 h-10 sm:w-8 sm:h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 hover:scale-110 transition-all duration-200 rounded-full shadow-sm group"
              onClick={handleLike}
              disabled={isLiking}
              aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
            >
              {isLiking ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-400" />
              ) : (
                <Heart
                  className={`w-4 h-4 transition-all duration-200 ${
                    liked 
                      ? "fill-red-500 text-red-500 scale-110 animate-pulse" 
                      : "text-gray-600 dark:text-gray-400 group-hover:text-red-500 group-hover:scale-110"
                  }`}
                />
              )}
            </Button>
            
            {/* Likes Count Badge - Better positioning */}
            {likes > 0 && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                {likes} {likes === 1 ? 'like' : 'likes'}
              </div>
            )}
          </div>

          {/* Content Container - Optimized spacing */}
          <div className="p-3 sm:p-4">
            {/* Title - Better mobile sizing */}
            <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-1">
              {title}
            </h3>
            
            {/* Location */}
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300 mb-2">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">{location}</span>
            </div>

            {/* Property Details - More compact */}
            {(bedrooms || bathrooms || area) && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-xs mb-2">
                {bedrooms && <span className="flex items-center gap-1">{bedrooms}🛏️</span>}
                {bathrooms && <span className="flex items-center gap-1">{bathrooms}🚿</span>}
                {area && <span className="text-xs">{area}</span>}
              </div>
            )}

            {/* Bottom Row - Price and Rating */}
            <div className="flex items-end justify-between">
              <div>
                <div className="font-bold text-sm sm:text-base text-foreground">
                  {price}
                  {status === "Rent" && <span className="text-xs text-gray-500 dark:text-gray-400 font-normal"> /mo</span>}
                </div>
                {type && (
                  <Badge variant="outline" className="text-xs mt-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                    {type}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-right">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground text-xs">{rating}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">({reviews})</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
