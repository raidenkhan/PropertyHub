// Updated SearchFilters.tsx with working filter logic

"use client"

import { useState, useEffect } from "react"
import { Filter, Grid3X3, List, Home, Building, TreePine, Search, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { motion } from "framer-motion"

export interface FilterOptions {
  location: string
  propertyType: string
  priceRange: string
  bedrooms: string
}

interface SearchFiltersProps {
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  onFiltersChange: (filters: FilterOptions) => void // New prop for filter changes
}

export function SearchFilters({ viewMode, onViewModeChange, onFiltersChange }: SearchFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [location, setLocation] = useState("")
  const [propertyType, setPropertyType] = useState("Any type")
  const [priceRange, setPriceRange] = useState("Any price")
  const [bedrooms, setBedrooms] = useState("Any")
  const [isExpanded, setIsExpanded] = useState(false) // Always start collapsed to avoid hydration mismatch
  const [hasMounted, setHasMounted] = useState(false)

  const propertyTypes = [
    { id: "apartment", label: "APPARTMENT", icon: Building },
    { id: "house", label: "HOUSE", icon: Home },
    { id: "commercial", label: "COMMERCIAL", icon: Building },
    { id: "office", label: "OFFICE", icon: Building },
    { id: "land", label: "LAND", icon: TreePine },
  ]

  const priceRanges = [
    { label: "Any price", min: 0, max: Infinity },
    { label: "Under ₦1M", min: 0, max: 1000000 },
    { label: "₦1M - ₦5M", min: 1000000, max: 5000000 },
    { label: "₦5M - ₦10M", min: 5000000, max: 10000000 },
    { label: "₦10M - ₦50M", min: 10000000, max: 50000000 },
    { label: "₦50M+", min: 50000000, max: Infinity },
  ]

  const bedroomOptions = ["Any", "1+", "2+", "3+", "4+", "5+"]

  // Handle responsive behavior after mount to avoid hydration mismatch
  useEffect(() => {
    setHasMounted(true)
    // Set initial expanded state based on screen size after hydration
    const updateExpandedState = () => {
      setIsExpanded(window.innerWidth >= 768)
    }
    
    // Set initial state
    updateExpandedState()
    
    // Listen for resize events
    window.addEventListener('resize', updateExpandedState)
    return () => window.removeEventListener('resize', updateExpandedState)
  }, [])

  // Apply filters whenever filter state changes
  useEffect(() => {
    const filters: FilterOptions = {
      location: location.trim(),
      propertyType: propertyType === "Any type" ? "" : propertyType,
      priceRange: priceRange === "Any price" ? "" : priceRange,
      bedrooms: bedrooms === "Any" ? "" : bedrooms,
    }
    onFiltersChange(filters)
  }, [location, propertyType, priceRange, bedrooms, onFiltersChange])

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) => {
      const updated = prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
     
      // Update corresponding state based on filter type
      const propertyTypeFilter = propertyTypes.find(type => type.id === filter)
      if (propertyTypeFilter) {
        setPropertyType(updated.includes(filter) ? propertyTypeFilter.label : "Any type")
      }
      
      return updated
    })
  }

  const handlePropertyTypeSelect = (value: string) => {
    setPropertyType(value)
    if (value !== "Any type") {
      const typeId = propertyTypes.find((type) => type.label === value)?.id
      if (typeId && !activeFilters.includes(typeId)) {
        setActiveFilters((prev) => [...prev.filter(f => !propertyTypes.some(t => t.id === f)), typeId])
      }
    } else {
      // Remove all property type filters
      setActiveFilters((prev) => prev.filter(f => !propertyTypes.some(t => t.id === f)))
    }
  }

  const handlePriceRangeSelect = (value: string) => {
    setPriceRange(value)
    
    // Update active filters for visual feedback
    const currentPriceFilters = activeFilters.filter(f => priceRanges.some(r => r.label === f))
    const newFilters = activeFilters.filter(f => !priceRanges.some(r => r.label === f))
    
    if (value !== "Any price") {
      setActiveFilters([...newFilters, value])
    } else {
      setActiveFilters(newFilters)
    }
  }

  const handleBedroomsSelect = (value: string) => {
    setBedrooms(value)
    
    // Update active filters for visual feedback
    const currentBedroomFilters = activeFilters.filter(f => bedroomOptions.includes(f))
    const newFilters = activeFilters.filter(f => !bedroomOptions.includes(f))
    
    if (value !== "Any") {
      setActiveFilters([...newFilters, value])
    } else {
      setActiveFilters(newFilters)
    }
  }

  const clearAllFilters = () => {
    setActiveFilters([])
    setPropertyType("Any type")
    setPriceRange("Any price")
    setBedrooms("Any")
    setLocation("")
  }

  const handleSearch = () => {
    // Force trigger filter update when search button is clicked
    const filters: FilterOptions = {
      location: location.trim(),
      propertyType: propertyType === "Any type" ? "" : propertyType,
      priceRange: priceRange === "Any price" ? "" : priceRange,
      bedrooms: bedrooms === "Any" ? "" : bedrooms,
    }
    onFiltersChange(filters)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-background/70 backdrop-blur-md border-b border-border sticky top-[73px] z-40 dark:bg-gray-900/70 dark:border-gray-700"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Collapsible Header */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${activeFilters.length > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`} />
              <h3 className="text-sm font-medium text-foreground dark:text-gray-200">
                Search & Filters
              </h3>
            </div>
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  {activeFilters.length} active
                </Badge>
                {!isExpanded && activeFilters.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1">
                    {activeFilters.slice(0, 3).map((filter) => (
                      <Badge
                        key={filter}
                        variant="outline"
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700"
                      >
                        {filter}
                      </Badge>
                    ))}
                    {activeFilters.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{activeFilters.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm hover:bg-accent dark:hover:bg-gray-700"
          >
            {isExpanded ? 'Hide Filters' : 'Show Filters'}
            {isExpanded ? 
              <ChevronUp className="w-4 h-4" /> : 
              <ChevronDown className="w-4 h-4" />
            }
          </Button>
        </div>

        {/* Compact Search Bar (Always Visible When Collapsed) */}
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="pb-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search locations..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-9 px-3"
                >
                  <Filter className="w-4 h-4" />
                  Clear
                </Button>
                <div className="flex items-center gap-1 bg-background rounded-lg p-1 border">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onViewModeChange("grid")}
                    className="w-8 h-7 p-0"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onViewModeChange("list")}
                    className="w-8 h-7 p-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Collapsible Content */}
        <motion.div
          initial={false}
          animate={{ 
            height: isExpanded ? 'auto' : 0,
            opacity: isExpanded ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="pb-4">
        {/* Mobile-Friendly Search Bar */}
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-0 mb-4 sm:mb-6 ">
          <motion.div
            className="bg-background md:rounded-full shadow-lg border border-border p-2 flex  sm:flex-row items-stretch sm:items-center gap-2 w-full sm:max-w-4xl dark:bg-gray-800 dark:border-gray-600"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {/* Location */}
            <div className="flex-1 px-4 py-2 sm:border-r border-border dark:border-gray-600">
              <div className="text-xs font-semibold text-foreground dark:text-gray-200 mb-1">
                Where
              </div>
              <Input
                type="text"
                placeholder="Search destinations"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-sm text-foreground placeholder-muted-foreground bg-transparent border-none outline-none dark:text-gray-200 dark:placeholder-gray-400"
                aria-label="Search destinations"
              />
            </div>

            {/* Property Type */}
            <div className="flex-1 px-4 py-2 border-r border-border dark:border-gray-600">
              <div className="text-xs font-semibold text-foreground dark:text-gray-200 mb-1">
                Property Type
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-foreground bg-transparent hover:bg-transparent justify-start dark:text-gray-200 dark:hover:bg-gray-700"
                    aria-label="Select property type"
                  >
                    {propertyType}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-background border-border dark:bg-gray-800 dark:border-gray-600">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm text-foreground hover:bg-accent dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => handlePropertyTypeSelect("Any type")}
                  >
                    Any type
                  </Button>
                  {propertyTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant="ghost"
                      className="w-full justify-start text-sm text-foreground hover:bg-accent dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={() => handlePropertyTypeSelect(type.label)}
                    >
                      <type.icon className="w-4 h-4 mr-2 dark:text-gray-300" />
                      {type.label}
                    </Button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            {/* Price Range */}
            <div className="flex-1 px-2 sm:px-4 py-2 border-r border-border dark:border-gray-600">
              <div className="text-xs font-semibold text-foreground dark:text-gray-200 mb-1">
                Price
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-foreground bg-transparent hover:bg-transparent justify-start dark:text-gray-200 dark:hover:bg-gray-700"
                    aria-label="Select price range"
                  >
                    {priceRange}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-background border-border dark:bg-gray-800 dark:border-gray-600">
                  {priceRanges.map((range) => (
                    <Button
                      key={range.label}
                      variant="ghost"
                      className="w-full justify-start text-sm text-foreground hover:bg-accent dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={() => handlePriceRangeSelect(range.label)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            {/* Bedrooms */}
            <div className="flex-1 px-4 py-2">
              <div className="text-xs font-semibold text-foreground dark:text-gray-200 mb-1">
                Bedrooms
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-foreground bg-transparent hover:bg-transparent justify-start dark:text-gray-200 dark:hover:bg-gray-700"
                    aria-label="Select number of bedrooms"
                  >
                    {bedrooms}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-background border-border dark:bg-gray-800 dark:border-gray-600">
                  {bedroomOptions.map((option) => (
                    <Button
                      key={option}
                      variant="ghost"
                      className="w-full justify-start text-sm text-foreground hover:bg-accent dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={() => handleBedroomsSelect(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            {/* Search Button */}
            <motion.button
              onClick={handleSearch}
              className="  hidden lg:flex bg-gradient-to-r from-blue-600 to-violet-600 text-white p-2 rounded-full hover:shadow-lg transition-all duration-200 dark:from-blue-700 dark:to-violet-700 sm:self-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Search properties"
            >
              <Search className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>

        {/* Secondary Controls - Desktop */}
        <div className="hidden sm:flex flex-wrap items-center justify-between gap-4 ">
          {/* Property Type Quick Filters */}
          <motion.div
            className="flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {propertyTypes.map((type) => {
              const Icon = type.icon
              const isActive = activeFilters.includes(type.id)

              return (
                <motion.button
                  key={type.id}
                  onClick={() => toggleFilter(type.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 min-w-[120px] ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md dark:bg-gray-800 dark:text-white"
                      : "bg-background text-foreground hover:bg-accent border border-border dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`Filter by ${type.label}`}
                >
                  <Icon className="w-4 h-4 dark:text-gray-300" />
                  {type.label}
                </motion.button>
              )
            })}
          </motion.div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Clear Filters Button */}
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="bg-background border-border hover:bg-accent rounded-full min-w-[100px] dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
              aria-label="Clear filters"
            >
              <Filter className="w-4 h-4 mr-2 dark:text-gray-300" />
              Clear Filters
              {activeFilters.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                >
                  {activeFilters.length}
                </Badge>
              )}
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-background rounded-full p-1 border border-border dark:bg-gray-800 dark:border-gray-600">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className="w-10 h-10 p-0 rounded-full dark:hover:bg-gray-700 dark:text-gray-300"
                aria-label="Grid view"
              >
                <Grid3X3 className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("list")}
                className="w-10 h-10 p-0 rounded-full dark:hover:bg-gray-700 dark:text-gray-300"
                aria-label="List view"
              >
                <List className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Filters - Sheet */}
        <div className="sm:hidden flex justify-end mb-4 ">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="bg-background border-border hover:bg-accent rounded-full dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
                aria-label="Open filters"
              >
                <Filter className="w-4 h-4 mr-2 dark:text-gray-300" />
                Filters
                {activeFilters.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="bg-background border-border rounded-t-xl dark:bg-gray-800 dark:border-gray-600 p-6"
            >
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground dark:text-white">Filters</h3>

                {/* Property Type Filters */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground dark:text-gray-200">Property Type</h4>
                  <div className="flex flex-wrap gap-2">
                    {propertyTypes.map((type) => {
                      const Icon = type.icon
                      const isActive = activeFilters.includes(type.id)

                      return (
                        <Button
                          key={type.id}
                          onClick={() => toggleFilter(type.id)}
                          variant={isActive ? "default" : "outline"}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                            isActive
                              ? "bg-primary text-primary-foreground dark:bg-gray-800 dark:text-white"
                              : "bg-background border-border dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                          }`}
                          aria-label={`Filter by ${type.label}`}
                        >
                          <Icon className="w-4 h-4 dark:text-gray-300" />
                          {type.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground dark:text-gray-200">View Mode</h4>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onViewModeChange("grid")}
                      className="flex-1 rounded-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      aria-label="Grid view"
                    >
                      <Grid3X3 className="w-5 h-5 mx-auto" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onViewModeChange("list")}
                      className="flex-1 rounded-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      aria-label="List view"
                    >
                      <List className="w-5 h-5 mx-auto" />
                    </Button>
                  </div>
                </div>

                {/* Clear All */}
                {activeFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={clearAllFilters}
                    className="w-full text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white"
                    aria-label="Clear all filters"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <motion.div
            className="hidden sm:flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border dark:border-gray-700"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span className="text-sm text-muted-foreground font-medium dark:text-gray-400">
              Active filters:
            </span>
            {activeFilters.map((filter) => (
              <Badge
                key={filter}
                variant="secondary"
                className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer rounded-full dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                onClick={() => toggleFilter(filter)}
                aria-label={`Remove ${filter} filter`}
              >
                {filter}
                <span className="ml-1">×</span>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground rounded-full dark:text-gray-400 dark:hover:text-white"
              aria-label="Clear all filters"
            >
              Clear all
            </Button>
          </motion.div>
        )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}