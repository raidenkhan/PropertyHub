"use client";

import React, { useEffect } from 'react';
import { SplashScreen, usePWADetection, useSplashScreen } from './SplashScreen';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const { isPWA, isStandalone } = usePWADetection();
  const { showSplash, hideSplash } = useSplashScreen(isPWA, 2500);

  // Set PWA installation flag when running standalone
  useEffect(() => {
    if (isStandalone) {
      localStorage.setItem('pwa-installed', 'true');
    }
  }, [isStandalone]);

  // Add PWA-specific body classes
  useEffect(() => {
    if (isPWA) {
      document.body.classList.add('pwa-mode');
    }
    if (isStandalone) {
      document.body.classList.add('standalone-mode');
    }

    return () => {
      document.body.classList.remove('pwa-mode', 'standalone-mode');
    };
  }, [isPWA, isStandalone]);

  // Prevent splash screen on regular web visits
  useEffect(() => {
    if (!isPWA && !isStandalone) {
      hideSplash();
    }
  }, [isPWA, isStandalone, hideSplash]);

  return (
    <>
      <SplashScreen 
        isVisible={showSplash} 
        onComplete={hideSplash}
        duration={2500}
      />
      {children}
    </>
  );
}