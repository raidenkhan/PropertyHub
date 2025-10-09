"use client"
import { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Home, Plus, MapPin, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { Property } from "@/types/property"

interface PropertiesTabProps {
  properties: Property[];
}

const PropertiesTabComponent = ({ properties }: PropertiesTabProps) => {
  const router = useRouter()

  if (properties.length === 0) {
    return (
      <div className="text-center py-8 md:py-12">
        <Home className="mx-auto h-12 w-12 md:h-16 md:w-16 text-muted-foreground dark:text-gray-400 mb-4" />
        <h3 className="text-lg md:text-xl font-semibold text-foreground dark:text-white mb-2">No Properties Listed</h3>
        <p className="text-sm md:text-base text-muted-foreground dark:text-gray-300 mb-6">Start listing your properties to earn money!</p>
        <Button onClick={() => router.push("/host/properties/new")} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> List Your First Property
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-3 md:space-y-4">
        {/* Mobile List View */}
        <div className="block md:hidden space-y-3">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-card/30 backdrop-blur-sm">
              <div className="flex items-stretch">
                <div className="relative w-24 flex-shrink-0">
                  <div className="aspect-square w-full">
                    <OptimizedImage
                      src={property.images?.[0] || "/placeholder-image.png"}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      width={96}
                      height={96}
                      sizes="96px"
                    />
                  </div>
                  <Badge className={`absolute top-1 right-1 text-xs px-1 py-0.5 ${
                    property.status === "Available" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                    property.status === "Sold" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}>
                    {property.status}
                  </Badge>
                </div>
                <div className="flex-1 p-3">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">{property.title}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs">{property.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{property.price}</span>
                    <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => router.push(`/properties/${property.id}`)}>
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Desktop Grid View */}
        <div className="hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-muted">
                <OptimizedImage 
                  src={property.images?.[0] || "/placeholder-image.png"} 
                  alt={property.title} 
                  className="w-full h-full object-cover" 
                  width={400}
                  height={200}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold line-clamp-2">{property.title}</h3>
                  <Badge className={
                    property.status === "Available" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                    property.status === "Sold" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }>
                    {property.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{property.location}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold">{property.price}</span>
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/properties/${property.id}`)}>
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export const PropertiesTab = memo(PropertiesTabComponent)
