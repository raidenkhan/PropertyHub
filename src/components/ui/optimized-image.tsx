"use client"
import { useState, useRef, useEffect } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
  placeholder?: string
}

export function OptimizedImage({
  src,
  alt,
  className = "",
  width,
  height,
  priority = false,
  sizes,
  placeholder = "/placeholder-image.png"
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(placeholder)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    // Only load image when it's in viewport or priority is true
    if (priority) {
      loadImage()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage()
            observer.disconnect()
          }
        })
      },
      { 
        rootMargin: '50px',
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [src, priority])

  const loadImage = () => {
    const img = new Image()
    img.onload = () => {
      setImageSrc(src)
      setIsLoaded(true)
      setIsError(false)
    }
    img.onerror = () => {
      setImageSrc(placeholder)
      setIsLoaded(true)
      setIsError(true)
    }
    img.src = src
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-50'
      } ${className}`}
      width={width}
      height={height}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      style={{
        objectFit: 'cover',
        ...(width && height && { aspectRatio: `${width}/${height}` })
      }}
    />
  )
}