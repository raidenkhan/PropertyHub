"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Download, AlertTriangle } from 'lucide-react';

export default function PWATestPage() {
  const [pwaDeferredPrompt, setPwaDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [manifestData, setManifestData] = useState<any>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [installResult, setInstallResult] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone;
      setIsInstalled(isStandalone);
    };
    
    checkInstalled();

    // Test manifest loading
    const testManifest = async () => {
      try {
        const response = await fetch('/manifest.json');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setManifestData(data);
        console.log('Manifest loaded successfully:', data);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setManifestError(errorMsg);
        console.error('Manifest loading failed:', error);
      }
    };

    testManifest();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('beforeinstallprompt event fired:', e);
      setPwaDeferredPrompt(e);
      setCanInstall(true);
      setInstallResult('Install prompt available');
    };

    const handleAppInstalled = () => {
      console.log('App installed');
      setIsInstalled(true);
      setCanInstall(false);
      setPwaDeferredPrompt(null);
      setInstallResult('App successfully installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Timeout to check if install prompt appears
    const timeout = setTimeout(() => {
      if (!canInstall && !isInstalled) {
        setInstallResult('No install prompt after 5 seconds. Check browser support.');
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timeout);
    };
  }, [canInstall, isInstalled]);

  const handleInstall = async () => {
    if (!pwaDeferredPrompt) {
      setInstallResult('No install prompt available');
      return;
    }

    try {
      const result = await pwaDeferredPrompt.prompt();
      console.log('Install prompt result:', result);
      
      const choiceResult = await pwaDeferredPrompt.userChoice;
      console.log('User choice:', choiceResult);
      
      if (choiceResult.outcome === 'accepted') {
        setInstallResult('User accepted installation');
      } else {
        setInstallResult('User dismissed installation');
      }
      
      setPwaDeferredPrompt(null);
      setCanInstall(false);
    } catch (error) {
      console.error('Installation error:', error);
      setInstallResult(`Installation error: ${error}`);
    }
  };

  const browserInfo = typeof window !== 'undefined' ? {
    userAgent: navigator.userAgent,
    isEdge: navigator.userAgent.includes('Edg'),
    isChrome: navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg'),
    hasServiceWorker: 'serviceWorker' in navigator,
    isSecure: location.protocol === 'https:' || location.hostname === 'localhost'
  } : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>PWA Installation Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Installation Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {isInstalled ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">App Status</span>
                </div>
                <Badge variant={isInstalled ? "default" : "secondary"}>
                  {isInstalled ? "Installed" : "Not Installed"}
                </Badge>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {canInstall ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">Install Prompt</span>
                </div>
                <Badge variant={canInstall ? "default" : "secondary"}>
                  {canInstall ? "Available" : "Not Available"}
                </Badge>
              </div>
            </div>

            {/* Install Button */}
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleInstall} 
                disabled={!canInstall}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {canInstall ? "Install App" : "Install Not Available"}
              </Button>
              {installResult && (
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  {installResult}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manifest Status */}
        <Card>
          <CardHeader>
            <CardTitle>Manifest Status</CardTitle>
          </CardHeader>
          <CardContent>
            {manifestError ? (
              <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-200">Manifest Loading Failed</h3>
                  <p className="text-sm text-red-600 dark:text-red-400">{manifestError}</p>
                </div>
              </div>
            ) : manifestData ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Manifest loaded successfully</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(manifestData, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p>Loading manifest...</p>
            )}
          </CardContent>
        </Card>

        {/* Browser Info */}
        {browserInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Browser Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Browser:</strong> {
                    browserInfo.isEdge ? 'Microsoft Edge' : 
                    browserInfo.isChrome ? 'Google Chrome' : 
                    'Other'
                  }
                </div>
                <div>
                  <strong>Service Worker Support:</strong>{' '}
                  <Badge variant={browserInfo.hasServiceWorker ? "default" : "destructive"}>
                    {browserInfo.hasServiceWorker ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <strong>Secure Context:</strong>{' '}
                  <Badge variant={browserInfo.isSecure ? "default" : "destructive"}>
                    {browserInfo.isSecure ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
              <div className="mt-4">
                <strong>User Agent:</strong>
                <p className="text-xs mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded break-all">
                  {browserInfo.userAgent}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edge-Specific Instructions */}
        {browserInfo?.isEdge && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-200">Microsoft Edge PWA Installation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">Edge has specific PWA installation methods:</p>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Look for the <strong>app icon</strong> in the address bar (right side)</li>
                <li>Click the <strong>three dots menu</strong> → <strong>Apps</strong> → <strong>Install this site as an app</strong></li>
                <li>Use keyboard shortcut <strong>Ctrl+Shift+I</strong> to install</li>
                <li>Check if the site meets PWA criteria in DevTools → Application → Manifest</li>
              </ol>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 <strong>Tip:</strong> Edge might not show the install prompt immediately. 
                  Try refreshing the page or check the address bar for the app install icon.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}