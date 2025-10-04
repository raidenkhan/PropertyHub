"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { propertyLikesService } from '@/lib/api/propertyLikesService'
import { useAuth } from '@/lib/auth/authContext'

interface WishlistContextType {
  wishlistCount: number
  refreshWishlistCount: () => void
  isLoading: boolean
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistCount: 0,
  refreshWishlistCount: () => {},
  isLoading: false
})

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [wishlistCount, setWishlistCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const refreshWishlistCount = async () => {
    if (!user) {
      setWishlistCount(0)
      return
    }

    try {
      setIsLoading(true)
      const response = await propertyLikesService.getUserWishlist({ page: 1, limit: 1 })
      setWishlistCount(response.pagination.totalCount)
    } catch (error) {
      // Handle cases where backend endpoints might not be implemented yet
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          console.warn('Wishlist endpoints not yet implemented on backend')
          setWishlistCount(0)
          return
        }
      }
      console.error('Failed to fetch wishlist count:', error)
      setWishlistCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshWishlistCount()
  }, [user])

  return (
    <WishlistContext.Provider value={{ wishlistCount, refreshWishlistCount, isLoading }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)