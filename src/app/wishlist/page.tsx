"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, Search, Grid3X3, List, Filter, SortAsc, ArrowLeft, Trash2, Share2, MapPin, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PropertyCard } from '@/components/PropertyCard'
import { propertyLikesService } from '@/lib/api/propertyLikesService'
import { useAuth } from '@/lib/auth/authContext'
import { toast } from '@/hooks/use-toast'
import { WishlistProperty } from '@/types/property'

interface Pagination {
  totalCount: number
  totalPages: number
  currentPage: number
  limit: number
}

export default function WishlistPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [properties, setProperties] = useState<WishlistProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? "list" : "grid"
    }
    return "grid"
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState<Pagination>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 20
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
  }, [user, router])

  // Fetch wishlist
  const fetchWishlist = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await propertyLikesService.getUserWishlist({
        page,
        limit: pagination.limit,
        search: searchQuery || undefined,
      })
      
      setProperties(response.properties)
      setPagination(response.pagination)
    } catch (err) {
      let errorMessage = 'Failed to fetch wishlist'
      
      if (err instanceof Error) {
        if (err.message.includes('404') || err.message.includes('Not Found')) {
          errorMessage = 'Wishlist feature is not yet available. The backend endpoints are not implemented yet.'
        } else if (err.message.includes('No access token')) {
          errorMessage = 'Please log in to view your wishlist.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      console.error('Wishlist fetch error:', err)
      
      toast({
        title: "❌ Error",
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchWishlist()
    }
  }, [user, searchQuery])

  // Handle property removal from wishlist
  const handleRemoveFromWishlist = async (propertyId: string) => {
    try {
      await propertyLikesService.removeFromWishlist(propertyId)
      
      // Remove from local state
      setProperties(prev => prev.filter(p => p.id !== propertyId))
      setPagination(prev => ({ ...prev, totalCount: prev.totalCount - 1 }))
      
      toast({
        title: "💔 Removed from Wishlist",
        description: "Property removed from your wishlist",
      })
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
      toast({
        title: "❌ Error",
        description: "Failed to remove property. Please try again.",
      })
    }
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchWishlist(page)
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 dark:from-gray-950 dark:via-gray-900 dark:to-red-950">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between py-4 gap-4">
            {/* Left Section - Navigation & Title */}
            <div className="flex items-center gap-6 w-full lg:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Back</span>
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    My Wishlist
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      {loading ? 'Loading...' : `${pagination.totalCount} ${pagination.totalCount === 1 ? 'property' : 'properties'}`}
                    </span>
                    {!loading && pagination.totalCount > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span>Last updated now</span>
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
                  placeholder="Search your saved properties..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 rounded-xl shadow-sm text-sm"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          // Loading State
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-500/30 border-t-red-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your wishlist...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Finding your saved properties</p>
            </div>
          </div>
        ) : error ? (
          // Error State
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">We couldn't load your wishlist. Please try again.</p>
              <Button onClick={() => fetchWishlist()} className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </div>
          </div>
        ) : properties.length === 0 ? (
          // Empty State
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your wishlist is empty</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery 
                  ? "No saved properties match your search. Try different keywords or browse all your saved properties."
                  : "Start exploring properties and save your favorites here by clicking the heart icon."
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => router.push('/')}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Browse Properties
                </Button>
                {searchQuery && (
                  <Button 
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    className="border-gray-200 dark:border-gray-700"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Properties Grid
          <div className="space-y-6">
            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {searchQuery ? 'Search Results' : 'Saved Properties'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {searchQuery 
                    ? `${properties.length} properties found for "${searchQuery}"`
                    : `${pagination.totalCount} ${pagination.totalCount === 1 ? 'property' : 'properties'} in your wishlist`
                  }
                </p>
              </div>
            </div>

            {/* Properties Grid */}
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {properties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <PropertyCard
                    {...property}
                    viewMode={viewMode}
                    onLike={() => handleRemoveFromWishlist(property.id)}
                  />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={pagination.currentPage === page ? "default" : "outline"}
                    className={pagination.currentPage === page ? "bg-red-600 hover:bg-red-700" : ""}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}