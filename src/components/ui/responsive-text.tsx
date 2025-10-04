import React from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveTextProps {
  text: string
  maxLength?: number
  mobileMaxLength?: number
  className?: string
  truncate?: boolean
  showFullOnHover?: boolean
}

export function ResponsiveText({ 
  text, 
  maxLength = 50, 
  mobileMaxLength = 20, 
  className, 
  truncate = true,
  showFullOnHover = false
}: ResponsiveTextProps) {
  const getTruncatedText = (str: string, max: number) => {
    if (!truncate || str.length <= max) return str
    return str.substring(0, max).trim() + '...'
  }

  const desktopText = getTruncatedText(text, maxLength)
  const mobileText = getTruncatedText(text, mobileMaxLength)

  return (
    <span 
      className={cn(className)}
      title={showFullOnHover ? text : undefined}
    >
      <span className="hidden sm:inline">{desktopText}</span>
      <span className="sm:hidden">{mobileText}</span>
    </span>
  )
}

interface ResponsiveLocationButtonProps {
  locationText: string
  propertyCount: number | string
  onClick: () => void
  className?: string
  variant?: 'outline' | 'default' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
}

export function ResponsiveLocationButton({
  locationText,
  propertyCount,
  onClick,
  className = '',
  variant = 'outline',
  size = 'default'
}: ResponsiveLocationButtonProps) {
  // Determine button sizes based on size prop
  const sizeClasses = {
    sm: 'px-3 sm:px-4 py-1.5 text-xs sm:text-sm',
    default: 'px-4 sm:px-8 py-2 text-sm sm:text-base',
    lg: 'px-6 sm:px-10 py-3 text-base sm:text-lg'
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "transition-all duration-200 rounded-lg border font-medium",
        sizeClasses[size],
        variant === 'outline' && "border-border bg-background hover:bg-accent dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600",
        variant === 'default' && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        variant === 'ghost' && "border-transparent hover:bg-accent hover:text-accent-foreground",
        className
      )}
      aria-label={`View all properties in ${locationText}`}
    >
      {/* Desktop version */}
      <span className="hidden sm:inline">
        View all {propertyCount} properties in {locationText}
      </span>
      
      {/* Mobile version */}
      <span className="sm:hidden">
        <ResponsiveText 
          text={`View all ${propertyCount} in ${locationText}`}
          mobileMaxLength={25}
          showFullOnHover={true}
        />
      </span>
    </button>
  )
}

// Utility for category location display
interface CategoryLocationDisplayProps {
  location: string
  count: number
  className?: string
}

export function CategoryLocationDisplay({ location, count, className }: CategoryLocationDisplayProps) {
  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground dark:text-gray-300", className)}>
      <span>
        <ResponsiveText 
          text={`Over ${count.toLocaleString()} homes in ${location}`}
          maxLength={60}
          mobileMaxLength={30}
          showFullOnHover={true}
        />
      </span>
    </div>
  )
}