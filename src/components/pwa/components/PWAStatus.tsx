"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

export function PWAStatus() {
  const [isClient, setIsClient] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasServiceWorker, setHasServiceWorker] = useState(false);
  const [hasManifest, setHasManifest] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      // Check online status
      setIsOnline(navigator.onLine);
      
      // Check if running as standalone app
      setIsStandalone(
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      );
      
      // Check service worker
      setHasServiceWorker('serviceWorker' in navigator);
      
      // Check manifest
      const manifestLink = document.querySelector('link[rel="manifest"]');
      setHasManifest(!!manifestLink);
      
      // Listen for online/offline events
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  if (!isClient) {
    return null;
  }

  const StatusItem = ({ 
    label, 
    status, 
    description 
  }: { 
    label: string; 
    status: boolean; 
    description: string;
  }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {status ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="font-medium">{label}</span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>
      <Badge variant={status ? "default" : "destructive"}>
        {status ? "Ready" : "Missing"}
      </Badge>
    </div>
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          PWA Status
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-blue-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="font-medium">Connection Status</span>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center gap-2">
            {isStandalone ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="font-medium">App Mode</span>
          </div>
          <Badge variant={isStandalone ? "default" : "secondary"}>
            {isStandalone ? "Installed" : "Browser"}
          </Badge>
        </div>
        
        <StatusItem
          label="Service Worker"
          status={hasServiceWorker}
          description="Enables offline functionality and background sync"
        />
        
        <StatusItem
          label="Web App Manifest"
          status={hasManifest}
          description="Provides app metadata for installation"
        />
        
        <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
          <p>
            PWA Score: {[hasServiceWorker, hasManifest, isOnline].filter(Boolean).length}/3
          </p>
          {isStandalone && (
            <p className="text-green-600 dark:text-green-400 font-medium mt-1">
              🎉 App is installed and running in standalone mode!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}