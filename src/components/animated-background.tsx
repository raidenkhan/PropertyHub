"use client"
import { useState, useEffect } from "react"
import type { motion as MotionType } from "framer-motion"

// Defer loading of framer-motion until after mount to reduce initial JS cost
export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)
  const [motion, setMotion] = useState<typeof MotionType | null>(null)

  useEffect(() => {
    setMounted(true)

    // Respect reduced motion preference: skip loading framer-motion entirely
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const loadFramerMotion = () => {
      import("framer-motion")
        .then((m) => setMotion(() => m.motion))
        .catch(() => {
          // Fail silently
        })
    }

    // Use requestIdleCallback if available
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback?.(loadFramerMotion)
    } else {
      setTimeout(loadFramerMotion, 0)
    }
  }, [])

  // Static, CSS-only background for SSR and before motion is ready
  if (!mounted || !motion) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-violet-400/20 rounded-full blur-3xl" />
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-emerald-400/15 to-blue-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-violet-400/10 to-pink-400/10 rounded-full blur-3xl" />
      </div>
    )
  }

  const Motion = motion

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50" />

      <Motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-violet-400/20 rounded-full blur-3xl"
        animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <Motion.div
        className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-emerald-400/15 to-blue-400/15 rounded-full blur-3xl"
        animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 0.9, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      <Motion.div
        className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-violet-400/10 to-pink-400/10 rounded-full blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, -80, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {Array.from({ length: 20 }).map((_, i) => (
        <Motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -100, 0], opacity: [0, 1, 0] }}
          transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, delay: Math.random() * 5, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}