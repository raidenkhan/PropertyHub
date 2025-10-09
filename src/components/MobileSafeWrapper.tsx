"use client"

import { ReactNode } from 'react'
import { useResponsive } from '@/hooks/useResponsive'

interface MobileSafeWrapperProps {
  children: ReactNode
  className?: string
  /** Add extra bottom padding beyond the mobile nav */
  extraBottomPadding?: boolean
  /** Use margin instead of padding for bottom spacing */
  useMargin?: boolean
}

/**
 * Wrapper component that ensures content is not covered by the mobile bottom navigation
 * Automatically applies appropriate spacing only on mobile/tablet devices
 */
export function MobileSafeWrapper({ 
  children, 
  className = "",
  extraBottomPadding = false,
  useMargin = false
}: MobileSafeWrapperProps) {
  const { isMobileOrTablet } = useResponsive()

  const getSpacingClass = () => {
    if (!isMobileOrTablet) return ""
    
    const baseSpacing = useMargin ? "mobile-safe-margin-bottom" : "mobile-safe-bottom"
    const extraSpacing = extraBottomPadding ? " pb-6" : ""
    
    return `${baseSpacing}${extraSpacing}`
  }

  return (
    <div className={`${className} ${getSpacingClass()}`.trim()}>
      {children}
    </div>
  )
}