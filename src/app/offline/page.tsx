"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw, Home, Search } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleRetry = () => {
    if (isOnline) {
      // Try to navigate back or to home
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
              isOnline ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <WifiOff className={`h-8 w-8 ${
                isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
              }`} />
            </div>
          </div>
          <CardTitle className="text-xl mb-2">
            {isOnline ? 'Connection Restored!' : 'You\'re Offline'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            {isOnline 
              ? 'Your internet connection has been restored. You can now continue browsing PropertyHub.'
              : 'It looks like you\'re not connected to the internet. Some features may not be available.'
            }
          </p>

          <div className="space-y-3">
            {isOnline ? (
              <Button 
                onClick={handleRetry}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Continue Browsing
              </Button>
            ) : (
              <Button 
                onClick={handleRefresh}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}

            <div className="flex space-x-2">
              <Button 
                asChild
                variant="outline"
                className="flex-1"
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
              
              <Button 
                asChild
                variant="outline"
                className="flex-1"
                disabled={!isOnline}
              >
                <Link href="/properties">
                  <Search className="mr-2 h-4 w-4" />
                  Browse
                </Link>
              </Button>
            </div>
          </div>

          {!isOnline && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                While you're offline:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Previously viewed properties may still be available</li>
                <li>• Your saved properties are accessible</li>
                <li>• New searches require an internet connection</li>
              </ul>
            </div>
          )}

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}