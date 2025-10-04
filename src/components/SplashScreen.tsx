"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  isVisible: boolean;
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ isVisible, onComplete, duration = 2500 }: SplashScreenProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Start showing content after a brief delay
      const contentTimer = setTimeout(() => {
        setShowContent(true);
      }, 100);

      // Complete splash screen after duration
      const completeTimer = setTimeout(() => {
        onComplete();
      }, duration);

      return () => {
        clearTimeout(contentTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary to-purple-600 overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white/20 rounded-full blur-xl animate-pulse" />
            <div className="absolute bottom-32 right-16 w-48 h-48 bg-white/10 rounded-full blur-xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-2xl animate-pulse delay-500" />
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={showContent ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 15,
              delay: 0.2 
            }}
            className="relative z-10 flex flex-col items-center text-white"
          >
            {/* Logo/Icon */}
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={showContent ? { rotate: 0, scale: 1 } : { rotate: -180, scale: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                delay: 0.4 
              }}
              className="mb-6"
            >
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/30 shadow-2xl">
                <div className="w-16 h-16 bg-gradient-to-br from-white to-white/80 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl font-black text-primary">P</span>
                </div>
              </div>
            </motion.div>

            {/* App Name */}
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={showContent ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 100, 
                damping: 15,
                delay: 0.6 
              }}
              className="text-4xl md:text-5xl font-black mb-3 tracking-tight"
            >
              PropertyHub
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={showContent ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 100, 
                damping: 15,
                delay: 0.8 
              }}
              className="text-lg md:text-xl text-white/90 font-medium text-center px-8 mb-8"
            >
              Your Dream Property Awaits
            </motion.p>

            {/* Loading Animation */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={showContent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 100, 
                damping: 15,
                delay: 1.0 
              }}
              className="flex flex-col items-center gap-4"
            >
              {/* Loading Dots */}
              <div className="flex gap-2">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: index * 0.2,
                      ease: "easeInOut"
                    }}
                    className="w-3 h-3 bg-white/80 rounded-full"
                  />
                ))}
              </div>

              {/* Loading Progress Bar */}
              <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: duration / 1000 - 0.5,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="h-full bg-white/80 rounded-full"
                />
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-white/70 text-sm font-medium mt-2"
              >
                Loading your experience...
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Bottom Branding */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={showContent ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 15,
              delay: 1.4 
            }}
            className="absolute bottom-8 left-0 right-0 text-center"
          >
            <p className="text-white/60 text-sm font-medium">
              Nigeria&apos;s Leading Real Estate Platform
            </p>
          </motion.div>

          {/* Subtle Version Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="absolute bottom-4 right-4 text-white/40 text-xs font-mono"
          >
            v1.0.0
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for detecting PWA installation
export function usePWADetection() {
  const [isPWA, setIsPWA] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const checkPWAMode = () => {
      // Check if app is installed and running in standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      
      // Check if launched from home screen (additional indicators)
      const isPWAInstalled = localStorage.getItem('pwa-installed') === 'true';
      
      setIsStandalone(isStandalone);
      setIsPWA(isStandalone || isPWAInstalled);
    };

    checkPWAMode();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWAMode);

    return () => mediaQuery.removeEventListener('change', checkPWAMode);
  }, []);

  return { isPWA, isStandalone };
}

// Hook for managing splash screen state
export function useSplashScreen(showCondition: boolean = true, duration: number = 2500) {
  const [showSplash, setShowSplash] = useState(false);
  const [hasShownSplash, setHasShownSplash] = useState(false);

  useEffect(() => {
    // Only show splash if condition is met and hasn't been shown in this session
    if (showCondition && !hasShownSplash) {
      setShowSplash(true);
      setHasShownSplash(true);
    }
  }, [showCondition, hasShownSplash]);

  const hideSplash = () => {
    setShowSplash(false);
  };

  return { showSplash, hideSplash };
}