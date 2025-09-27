"use client"

import { Heart, MapPin, Star, Eye, MessageCircle } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface PropertyCardProps {
  id: string
  title: string
  location: string
  price: string
  type?: string
  status: "Available" | "Sold" | "Rent" | "Commercial" | "House"
  bedrooms?: number
  bathrooms?: number
  area?: string
  rating: number
  reviews: number
  image: string
  isLiked?: boolean
  onLike?: (id: string) => void
 

  delay?: number
  viewMode?: "grid" | "list"
}

export function PropertyCard({
  id,
  title,
  location,
  price,
  type,
  status,
  bedrooms,
  bathrooms,
  area,
  rating,
  reviews,
  image,
  isLiked = false,
  onLike,
 

  delay = 0,
  viewMode = "grid",
}: PropertyCardProps) {
  const router = useRouter()
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800"
      case "Sold":
        return "bg-red-500/10 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800"
      case "Rent":
        return "bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800"
      default:
        return "bg-muted/50 text-muted-foreground border-border"
    }
  }
  const handleViewDetails = () => {
    router.push(`/property/${id}`)
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2 }}
      className="group w-full"
    >
      <Link href={`/property/${id}`} className="block">
        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg dark:shadow-lg dark:shadow-white/5 dark:hover:shadow-white/10 transition-all duration-300 bg-card/30 backdrop-blur-sm">
          <div className={viewMode === "list" ? "flex flex-row items-stretch" : "flex flex-col"}>
            {/* Image Container */}
            <div className={viewMode === "list" ? "relative w-1/3" : "relative w-full"}>
              <div className={viewMode === "list" ? "aspect-[16/9] w-full" : "aspect-[4/3] w-full"}>
                <img
                  src={image || "/placeholder.svg"}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
                  loading="lazy"
                />
              </div>
              {/* Status Badge */}
              <Badge
                className={`absolute top-4 left-4 ${getStatusColor(status)} border px-3 py-1 text-sm font-medium backdrop-blur-sm`}
              >
                {status}
              </Badge>

              {/* Type Badge */}
              <Badge
                variant="secondary"
                className={`absolute top-4 ${viewMode === "list" ? "right-16" : "right-14"} bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 backdrop-blur-sm border-0 px-3 py-1 text-sm font-medium`}
              >
                {type}
              </Badge>

              {/* Like Button */}
              <Button
                variant="ghost"
                size="sm"
                className={`absolute top-4 right-4 ${viewMode === "list" ? "w-10 h-10" : "w-8 h-8"} bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-200 rounded-full`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLike?.(id);
                }}
                aria-label={isLiked ? "Unlike property" : "Like property"}
              >
                <Heart
                  className={`transition-colors ${viewMode === "list" ? "w-5 h-5" : "w-4 h-4"} ${isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                />
              </Button>

              {/* Overlay with actions - now visible on focus-within as well */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <Button
                  size={viewMode === "list" ? "lg" : "sm"}
                  className="bg-card/90 text-foreground hover:bg-card backdrop-blur-sm"
                  tabIndex={-1} // The card is the link, so this button is decorative for keyboard users
                >
                  <Eye className={viewMode === "list" ? "w-5 h-5 mr-2" : "w-4 h-4 mr-2"} />
                  View Details
                </Button>
              </div>
            </div>

            {/* Content Container */}
            <CardContent className={viewMode === "list" ? "flex-1 p-6 flex flex-col justify-between" : "p-4"}>
              <div className={viewMode === "list" ? "space-y-4" : "space-y-3"}>
                {/* Title and Location */}
                <div>
                  <h3
                    className={`font-semibold group-hover:text-primary transition-colors line-clamp-2 ${
                      viewMode === "list" ? "text-xl" : "text-lg"
                    } text-foreground`}
                  >
                    {title}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground mt-2">
                    <MapPin className={viewMode === "list" ? "w-4 h-4" : "w-3 h-3"} />
                    <span className={viewMode === "list" ? "text-base" : "text-sm"}>{location}</span>
                  </div>
                </div>

                {/* Property Details */}
                {(bedrooms || bathrooms || area) && (
                  <div
                    className={`flex items-center gap-6 text-muted-foreground ${viewMode === "list" ? "text-base" : "text-sm"}`}
                  >
                    {bedrooms && <span>{bedrooms} bed</span>}
                    {bathrooms && <span>{bathrooms} bath</span>}
                    {area && <span>{area}</span>}
                  </div>
                )}

                {/* Rating and Reviews */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className={`fill-amber-400 text-amber-400 ${viewMode === "list" ? "w-5 h-5" : "w-4 h-4"}`} />
                    <span className={`font-medium text-foreground ${viewMode === "list" ? "text-base" : "text-sm"}`}>
                      {rating}
                    </span>
                  </div>
                  <span className={`${viewMode === "list" ? "text-base" : "text-sm"} text-muted-foreground`}>
                    ({reviews} reviews)
                  </span>
                </div>
              </div>

              {/* Price and Action */}
              <div
                className={
                  viewMode === "list"
                    ? "flex items-center justify-between pt-4"
                    : "flex items-center justify-between pt-2"
                }
              >
                <div>
                  <span className={`font-bold text-foreground ${viewMode === "list" ? "text-2xl" : "text-xl"}`}>
                    {price}
                  </span>
                  {status === "Rent" && (
                    <span className={`${viewMode === "list" ? "text-base" : "text-sm"} text-muted-foreground`}>
                      /month
                    </span>
                  )}
                </div>
                <Button
                  size={viewMode === "list" ? "lg" : "sm"}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                  tabIndex={-1} // The card is the link, so this button is decorative for keyboard users
                >
                  Book Tour
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
