"use client"
import { PropertyCard } from "@/components/PropertyCard"
import { motion } from "motion/react"
import { Property } from "@/types/property"

interface PropertyGridProps {
  properties: Property[]
  viewMode: "grid" | "list"
  onLike: (id: string) => void
}

export function PropertyGrid({ properties, viewMode, onLike }: PropertyGridProps) {
 
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Results Header */}
      <motion.div
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Featured Properties</h2>
          <p className="text-slate-600">Showing {properties.length} properties • Updated 2 minutes ago</p>
        </div>

        <motion.div
          className="hidden sm:flex items-center gap-4 text-sm text-slate-600"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="text-slate-700">Sort by:</span>
          <select className="bg-white border border-slate-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-700">
            <option>Most Recent</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Most Popular</option>
          </select>
        </motion.div>
      </motion.div>

      {/* Property Grid - Mobile-optimized */}
      <motion.div
        className={`grid ${
          viewMode === "grid" 
            ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6" 
            : "grid-cols-1 gap-6"
        }`}
        layout
      >
        {properties.map((property, index) => (
          <PropertyCard key={property.id} {...property} onLike={onLike} delay={index * 0.1} viewMode={viewMode} />
        ))}
      </motion.div>

      {/* Load More - Mobile Safe */}
      <motion.div
        className="text-center mt-12 mobile-safe-bottom pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <motion.button
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Load More Properties
        </motion.button>
        <p className="text-slate-500 text-sm mt-3">Showing 6 of 1,247 properties</p>
      </motion.div>
    </div>
  )
}
