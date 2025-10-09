// src/app/dashboard/page.tsx
"use client";
import { useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs,  TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Home, 
  DollarSign, 
  MessageSquare, 
  Bell, 
  Plus, 
  Package, 
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Star,
  Eye
} from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";
import { AnimatedBackground } from "@/components/animated-background";
import { DashboardHeroSkeleton, StatsGridSkeleton, QuickActionsSkeleton, PropertiesGridSkeleton } from "@/components/dashboard/Skeletons";
import { ModeToggle } from "@/components/dashboard/ModeToggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { useDataCache } from "@/contexts/DataCacheContext";
import { useNotifications } from "@/contexts/NotificationContext";
// import { PerformanceMonitor } from "@/lib/performance";

// Lazy load tab components
const OverviewTab = lazy(() => import("@/components/dashboard/tabs/OverviewTab").then(module => ({ default: module.OverviewTab })));
const PropertiesTab = lazy(() => import("@/components/dashboard/tabs/PropertiesTab").then(module => ({ default: module.PropertiesTab })));

// Loading fallback component
const TabLoadingFallback = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Types
interface Property {
  id: number;
  title: string;
  description?: string;
  location: string;
  price: number;
  status: string;
  type?: string;
  images: string[];
  amenities?: string[];
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  createdAt: string;
  updatedAt?: string;
}

interface DashboardTransaction {
  id: number;
  amount: number;
  status: string;
  property: { title: string; location: string };
  createdAt: string;
}

interface DashboardMessage {
  id: number;
  sender: { name: string };
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const { notifications, unreadCount, loading: notificationsLoading, markAsRead } = useNotifications();
  
  // Use cached data instead of local state
  const {
    properties,
    transactions,
    conversations,
    stats,
    isLoading,
    fetchAllData,
    prefetchData,
    getCacheStatus
  } = useDataCache();

  // Initialize data cache on mount
  useEffect(() => {
    if (user) {
      fetchAllData().catch(error => {
        console.error('Failed to fetch dashboard data:', error);
        toast({
          title: "❌ Load Failed",
          description: "Some data could not be loaded. Please refresh.",
        });
      });
    }
  }, [user, fetchAllData]);

  // Prefetch data based on active tab for better perceived performance
  useEffect(() => {
    const prefetchKeys: string[] = [];
    
    switch (activeTab) {
      case 'properties':
        prefetchKeys.push('properties');
        break;
      case 'purchases':
        prefetchKeys.push('transactions');
        break;
      case 'messages':
        prefetchKeys.push('conversations');
        break;
      case 'notifications':
        prefetchKeys.push('notifications');
        break;
      default:
        // Overview tab might need all data
        prefetchKeys.push('properties', 'transactions');
    }
    
    if (prefetchKeys.length > 0) {
      prefetchData(prefetchKeys);
    }
  }, [activeTab, prefetchData]);
  
  // Initialize performance tracking
  useEffect(() => {
    //PerformanceMonitor.trackWebVitals();
    
    // Register service worker for caching
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 relative">
        <AnimatedBackground />
        <Header />
        <ModeToggle />
        <DashboardHeroSkeleton />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <StatsGridSkeleton />
          <QuickActionsSkeleton />
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader className="border-b border-border pb-0">
              <div className="flex gap-2 p-1">
                <div className="bg-muted h-9 w-24 rounded-md animate-pulse" />
                <div className="bg-muted h-9 w-28 rounded-md animate-pulse" />
                <div className="bg-muted h-9 w-28 rounded-md animate-pulse" />
                <div className="bg-muted h-9 w-28 rounded-md animate-pulse" />
                <div className="bg-muted h-9 w-24 rounded-md animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <PropertiesGridSkeleton items={6} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    
      <div className="min-h-screen bg-background dark:bg-gray-900 relative">
        <AnimatedBackground />
        <Header />
        <ModeToggle />

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-600 py-6 px-4 md:py-8 md:px-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_50%)]"></div>
          </div>
          <div className="max-w-7xl mx-auto relative">
            <div className="flex flex-col items-start gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Welcome back, {user?.name?.split(" ")[0] || "User"}!</h1>
                <p className="text-blue-100 text-base md:text-lg lg:text-xl max-w-2xl">
                  Manage your properties, track purchases, and stay updated.
                </p>
              </div>
              <Button
                size="default"
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => router.push("/")}
              >
                <Home className="mr-2 h-4 w-4" /> Browse Properties
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Stats Cards - 2x2 grid on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground dark:text-gray-300">Listings</p>
                    <p className="text-xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalListings}</p>
                  </div>
                  <Home className="h-5 w-5 md:h-8 md:w-8 text-blue-500 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground dark:text-gray-300">Purchases</p>
                    <p className="text-xl md:text-3xl font-bold text-green-600 dark:text-green-400">{stats.activePurchases}</p>
                  </div>
                  <ShoppingBag className="h-5 w-5 md:h-8 md:w-8 text-green-500 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground dark:text-gray-300">Messages</p>
                    <p className="text-xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.unreadMessages}</p>
                  </div>
                  <MessageSquare className="h-5 w-5 md:h-8 md:w-8 text-orange-500 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground dark:text-gray-300">Alerts</p>
                    <p className="text-xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.unreadNotifications}</p>
                  </div>
                  <Bell className="h-5 w-5 md:h-8 md:w-8 text-purple-500 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions - 2x2 grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8"
          >
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer" onClick={() => router.push("/host/properties/new")}>
              <CardContent className="p-4 md:p-6 text-center">
                <div className="h-12 w-12 md:h-16 md:w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Plus className="h-5 w-5 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">List Property</h3>
                <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Add property for sale</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer" onClick={() => router.push("/")}>
              <CardContent className="p-4 md:p-6 text-center">
                <div className="h-12 w-12 md:h-16 md:w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Home className="h-5 w-5 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">Browse</h3>
                <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Find properties</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer" onClick={() => router.push("/messages")}>
              <CardContent className="p-4 md:p-6 text-center">
                <div className="h-12 w-12 md:h-16 md:w-16 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <MessageSquare className="h-5 w-5 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">Messages</h3>
                <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Chat with users</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer" onClick={() => router.push("/payouts")}>
              <CardContent className="p-4 md:p-6 text-center">
                <div className="h-12 w-12 md:h-16 md:w-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <DollarSign className="h-5 w-5 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">Payouts</h3>
                <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Track earnings</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader className="border-b border-border pb-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-1">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 py-2">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="properties" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 py-2">
                    Properties
                  </TabsTrigger>
                  <TabsTrigger value="purchases" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 py-2">
                    Purchases
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 py-2">
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 py-2">
                    Alerts
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <Suspense fallback={<TabLoadingFallback />}>
                      <OverviewTab />
                    </Suspense>
                  )}

                  {/* Properties Tab */}
                  {activeTab === "properties" && (
                    <Suspense fallback={<TabLoadingFallback />}>
                      <PropertiesTab properties={properties} />
                    </Suspense>
                  )}

                                 {/* Purchases Tab */}
                {/* Purchases Tab */}
{activeTab === "purchases" && (
  <div className="space-y-4 md:space-y-6">
    {transactions.length === 0 ? (
      <div className="text-center py-8 md:py-12">
        <ShoppingBag className="mx-auto h-12 w-12 md:h-16 md:w-16 text-muted-foreground dark:text-gray-400 mb-4" />
        <h3 className="text-lg md:text-xl font-semibold text-foreground dark:text-white mb-2">No Purchases Yet</h3>
        <p className="text-sm md:text-base text-muted-foreground dark:text-gray-300 mb-6">Browse properties and make your first purchase!</p>
        <Button onClick={() => router.push("/")} className="bg-primary hover:bg-primary/90">
          <Home className="mr-2 h-4 w-4" /> Browse Properties
        </Button>
      </div>
    ) : (
      <>
        {/* Mobile List View */}
        <div className="block md:hidden space-y-3">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="border-l-4 border-l-primary">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">{transaction.property.title}</h3>
                  <p className="text-xs text-muted-foreground">{transaction.property.location}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">₦{transaction.amount.toLocaleString()}</span>
                    <Badge className={
                      transaction.status === "COMPLETED" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                      transaction.status === "ESCROW" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }>
                      {transaction.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{new Date(transaction.createdAt).toLocaleDateString()}</span>
                    <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => router.push(`/transactions/${transaction.id}`)}>
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.property.title}</TableCell>
                  <TableCell>{transaction.property.location}</TableCell>
                  <TableCell>₦{transaction.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={
                      transaction.status === "COMPLETED" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                      transaction.status === "ESCROW" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/transactions/${transaction.id}`)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    )}
  </div>
)}

                  {/* Messages Tab */}
                  {activeTab === "messages" && (
                    <div className="space-y-4 md:space-y-6">
                      {conversations.length === 0 ? (
                        <div className="text-center py-8 md:py-12">
                          <MessageSquare className="mx-auto h-12 w-12 md:h-16 md:w-16 text-muted-foreground dark:text-gray-400 mb-4" />
                          <h3 className="text-lg md:text-xl font-semibold text-foreground dark:text-white mb-2">No Conversations Yet</h3>
                          <p className="text-sm md:text-base text-muted-foreground dark:text-gray-300">You &apos ll see conversations with buyers or sellers here.</p>
                          <Button onClick={() => router.push("/messages")} className="mt-4">
                            <MessageSquare className="mr-2 h-4 w-4" /> Go to Messages
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3 md:space-y-4">
                          {conversations.map((conversation) => (
                            <Card 
                              key={conversation.id} 
                              className="border-l-4 border-l-primary dark:border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => router.push(`/messages?user=${conversation.id}`)}
                            >
                              <CardContent className="p-3 md:p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Avatar className="h-6 w-6 md:h-8 md:w-8">
                                        <AvatarFallback className="text-xs">
                                          {conversation.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <h3 className="font-semibold text-sm md:text-base">{conversation.name}</h3>
                                    </div>
                                    <p className="text-xs md:text-sm text-muted-foreground">{conversation.email}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Click to view conversation</p>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-xs md:text-sm">
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          <div className="text-center pt-4">
                            <Button onClick={() => router.push("/messages")} variant="outline">
                              View All Messages
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === "notifications" && (
                    <div className="space-y-4 md:space-y-6">
                      {notificationsLoading ? (
                        <div className="flex items-center justify-center py-8 md:py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-8 md:py-12">
                          <Bell className="mx-auto h-12 w-12 md:h-16 md:w-16 text-muted-foreground dark:text-gray-400 mb-4" />
                          <h3 className="text-lg md:text-xl font-semibold text-foreground dark:text-white mb-2">No Notifications</h3>
                          <p className="text-sm md:text-base text-muted-foreground dark:text-gray-300">You &aposll be notified about important updates here.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 md:space-y-4">
                          {notifications.map((notification) => {
                            const handleNotificationClick = async () => {
                              if (!notification.read) {
                                try {
                                  await markAsRead(notification.id);
                                } catch (error) {
                                  console.error('Failed to mark notification as read:', error);
                                }
                              }
                              
                              // Handle navigation based on notification type
                              if (notification.type === 'PROPERTY_APPROVED' || notification.type === 'PROPERTY_REJECTED') {
                                // Navigate to properties management
                                router.push('/host/dashboard');
                              } else if (notification.type === 'TRANSACTION_ESCROW_RELEASED' || notification.type === 'TRANSACTION_PAYMENT_CONFIRMED') {
                                // Navigate to transactions/payouts
                                router.push('/payouts');
                              } else if (notification.type === 'MESSAGE_RECEIVED') {
                                // Navigate to messages
                                router.push('/messages');
                              }
                            };
                            
                            return (
                              <Card 
                                key={notification.id} 
                                className={`transition-all cursor-pointer hover:shadow-lg ${
                                  !notification.read 
                                    ? "border-l-4 border-l-primary dark:border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10" 
                                    : "border-l-4 border-l-muted"
                                }`}
                                onClick={handleNotificationClick}
                              >
                                <CardContent className="p-3 md:p-4">
                                  <div className="flex items-start gap-3">
                                    {/* Notification Icon */}
                                    <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm ${
                                      notification.type.includes('PROPERTY') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' :
                                      notification.type.includes('TRANSACTION') ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
                                      notification.type.includes('MESSAGE') ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' :
                                      'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
                                    }`}>
                                      <span className="text-base md:text-lg">
                                        {notification.type.includes('PROPERTY') ? '🏠' :
                                         notification.type.includes('TRANSACTION') ? '💰' :
                                         notification.type.includes('MESSAGE') ? '💬' :
                                         '🔔'
                                        }
                                      </span>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <h3 className={`font-semibold text-sm md:text-base ${
                                          !notification.read 
                                            ? 'text-foreground dark:text-white' 
                                            : 'text-muted-foreground'
                                        }`}>
                                          {notification.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                          {!notification.read && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                          )}
                                          <Badge 
                                            variant={!notification.read ? "destructive" : "secondary"} 
                                            className="text-xs flex-shrink-0"
                                          >
                                            {!notification.read ? 'New' : 'Read'}
                                          </Badge>
                                        </div>
                                      </div>
                                      
                                      <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2">
                                        {notification.message}
                                      </p>
                                      
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(notification.createdAt).toLocaleDateString()}
                                        </p>
                                        
                                        {/* Related item info */}
                                        {(notification.property || notification.transaction || notification.dispute) && (
                                          <div className="text-xs text-muted-foreground">
                                            {notification.property && `Property: ${notification.property.title}`}
                                            {notification.transaction && `Transaction: ₦${notification.transaction.amount.toLocaleString()}`}
                                            {notification.dispute && `Dispute: ${notification.dispute.title}`}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Type badge */}
                                      <div className="mt-2">
                                        <Badge variant="outline" className="text-xs">
                                          {notification.type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
   
  );
}