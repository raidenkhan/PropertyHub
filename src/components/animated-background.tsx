"use client"
import { useState, useEffect } from "react"  // Add these imports for mounting logic
import { motion } from "framer-motion"  // Fixed import (was "motion/react" – assuming framer-motion)

export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)  // New: Track if component is mounted on client

  useEffect(() => {
    setMounted(true)  // New: Set to true only after client-side mount (useEffect runs post-hydration)
  }, [])

  if (!mounted) {
    // New: Render a static placeholder during SSR/hydration to avoid mismatches
    // This can be an empty div or a simple non-random version
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradient Background – safe to render on server */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50" />
        {/* Static placeholders for orbs – no animation/randomness */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-violet-400/20 rounded-full blur-3xl" />
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-emerald-400/15 to-blue-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-violet-400/10 to-pink-400/10 rounded-full blur-3xl" />
        {/* No particles during SSR to avoid random styles */}
      </div>
    )
  }

  // Client-side only: Full animated version with random particles
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50" />

      {/* Animated Orbs – these are safe (no randomness) */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-violet-400/20 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,  // Simplified from Number.POSITIVE_INFINITY
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-emerald-400/15 to-blue-400/15 rounded-full blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-violet-400/10 to-pink-400/10 rounded-full blur-3xl"
        animate={{
          x: [0, 60, 0],
          y: [0, -80, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating Particles – now only rendered on client with random positions */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}