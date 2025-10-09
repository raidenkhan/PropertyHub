"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeMeta() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Define theme colors based on your black/white theme
    const themeColors = {
      light: {
        primary: "#1f2937",      // Dark gray for light theme
        background: "#1f2937",   // Dark gray background
        surface: "#374151",     // Slightly lighter gray
      },
      dark: {
        primary: "#111827",      // Very dark gray
        background: "#111827",   // Very dark gray background
        surface: "#1f2937",     // Dark gray for surfaces
      }
    }

    const currentTheme = resolvedTheme === 'dark' ? 'dark' : 'light'
    const colors = themeColors[currentTheme]

    // Update theme-color meta tag (affects browser chrome/address bar)
    const updateMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = name
        document.head.appendChild(meta)
      }
      meta.content = content
    }

    // Update various theme-related meta tags
    updateMetaTag('theme-color', colors.background)
    updateMetaTag('msapplication-TileColor', colors.primary)
    updateMetaTag('msapplication-navbutton-color', colors.background)
    
    // Update Apple status bar style based on theme
    const appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement
    if (appleStatusBarMeta) {
      // Use 'black-translucent' for dark theme, 'default' for light theme
      appleStatusBarMeta.content = currentTheme === 'dark' ? 'black-translucent' : 'default'
    }

    // Update manifest theme colors dynamically if possible
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
    if (manifestLink) {
      // Create a dynamic manifest
      const manifest = {
        name: "PropertyHub",
        short_name: "PropertyHub", 
        theme_color: colors.background,
        background_color: colors.background,
        start_url: "/",
        display: "standalone",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512x512.png", 
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }

      // Create blob URL for dynamic manifest
      const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
      const manifestUrl = URL.createObjectURL(manifestBlob)
      
      // Update manifest href
      manifestLink.href = manifestUrl

      // Cleanup on unmount or theme change
      return () => {
        URL.revokeObjectURL(manifestUrl)
      }
    }

  }, [resolvedTheme, mounted])

  // This component doesn't render anything
  return null
}