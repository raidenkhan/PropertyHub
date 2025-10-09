import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth/authContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { DataCacheProvider } from "@/contexts/DataCacheContext";
import { GlobalCacheProvider } from "@/contexts/GlobalCacheContext";
import { Toaster } from "@/components/ui/sonner";
import { RouteTransition } from "@/components/system/RouteTransition";
import { NotificationToastProvider } from '@/components/NotificationToast';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { PWAProvider } from '@/components/PWAProvider';
import { WishlistProvider } from '@/lib/hooks/useWishlist';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { ThemeMeta } from '@/components/ThemeMeta';

export const metadata: Metadata = {
  title: "PropertyHub - Real Estate Marketplace",
  description: "Discover your dream property with PropertyHub - Nigeria's leading real estate marketplace",
  manifest: "/manifest.json",
  keywords: [
    "real estate", "property", "Nigeria", "buy", "sell", "rent", 
    "apartment", "house", "land", "commercial", "residential"
  ],
  authors: [{ name: "PropertyHub Team" }],
  creator: "PropertyHub",
  publisher: "PropertyHub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PropertyHub",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "PropertyHub",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
          rel="stylesheet"
        />
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#1f2937" />
        <meta name="background-color" content="#111827" />
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes" />
        
        {/* iOS Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PropertyHub" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        
        {/* Android Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="PropertyHub" />
        
        {/* Microsoft Meta Tags */}
        <meta name="msapplication-TileColor" content="#111827" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
     
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ThemeMeta />
            <GlobalCacheProvider>
              <DataCacheProvider>
                <WishlistProvider>
                  <NotificationProvider>
                    <NotificationToastProvider>
                      <PWAProvider>
                        <RouteTransition>
                          {children}
                        </RouteTransition>
                        <MobileBottomNav />
                        <Toaster />
                        <InstallPrompt />
                      </PWAProvider>
                    </NotificationToastProvider>
                  </NotificationProvider>
                </WishlistProvider>
              </DataCacheProvider>
            </GlobalCacheProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}