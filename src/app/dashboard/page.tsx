// src/app/dashboard/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Types
interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  status: string;
  images: string[];
  createdAt: string;
}

interface Transaction {
  id: number;
  amount: number;
  status: string;
  property: { title: string; location: string };
  createdAt: string;
}

interface Message {
  id: number;
  sender: { name: string };
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock data - replace with API calls
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    activePurchases: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Simulate API calls
        setTimeout(() => {
          setProperties([
            { id: 1, title: "Luxury Apartment in Lekki", location: "Lekki, Lagos", price: 8500000, status: "LISTED", images: ["/placeholder-property.jpg"], createdAt: "2025-09-01" },
            { id: 2, title: "Commercial Space in VI", location: "Victoria Island, Lagos", price: 12000000, status: "SOLD", images: ["/placeholder-property.jpg"], createdAt: "2025-08-15" },
          ]);
          
          setTransactions([
            { id: 1, amount: 49394304, status: "COMPLETED", property: { title: "Hotel Delala", location: "Lagos" }, createdAt: "2025-09-21" },
            { id: 2, amount: 7500000, status: "ESCROW", property: { title: "Apartment in Ikoyi", location: "Ikoyi, Lagos" }, createdAt: "2025-09-18" },
          ]);
          
          setMessages([
            { id: 1, sender: { name: "PropertyHub Support" }, content: "Your payment has been confirmed!", isRead: false, createdAt: "2025-09-21" },
            { id: 2, sender: { name: "Draylock Ray" }, content: "Hi, I'm interested in your property", isRead: true, createdAt: "2025-09-20" },
          ]);
          
          setNotifications([
            { id: 1, title: "Payment Received", message: "₦49,394,304 has been received for Hotel Delala", isRead: false, createdAt: "2025-09-21" },
            { id: 2, title: "Property Sold", message: "Your property 'Commercial Space in VI' has been sold", isRead: true, createdAt: "2025-09-15" },
          ]);
          
          setStats({
            totalListings: 2,
            activePurchases: 1,
            unreadMessages: 1,
            unreadNotifications: 1,
          });
          
          setIsLoading(false);
        }, 10);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: "❌ Load Failed",
          description: "Some data could not be loaded. Please refresh.",
        });
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

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
                    <div className="space-y-4 md:space-y-6">
                      <h2 className="text-xl md:text-2xl font-bold">Recent Activity</h2>
                      <div className="space-y-3 md:space-y-4">
                        {[
                          { type: "purchase", title: "Purchase Confirmed", message: "₦49,394,304 for Hotel Delala", time: "2 hours ago", status: "success" },
                          { type: "message", title: "New Message", message: "From Draylock Ray: Hi, I'm interested...", time: "1 day ago", status: "info" },
                          { type: "property", title: "Property Sold", message: "Commercial Space in VI has been sold", time: "3 days ago", status: "success" },
                        ].map((activity, index) => (
                          <Card key={index} className="border-l-4 border-l-primary dark:border-l-blue-500">
                            <CardContent className="p-3 md:p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-sm md:text-base">{activity.title}</h3>
                                  <p className="text-xs md:text-sm text-muted-foreground">{activity.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                                </div>
                                <Badge className={
                                  activity.status === "success" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                }>
                                  {activity.status === "success" ? <CheckCircle className="h-3 w-3 md:h-4 md:w-4" /> : <Clock className="h-3 w-3 md:h-4 md:w-4" />}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Properties Tab */}
                  {activeTab === "properties" && (
                    <div className="space-y-4 md:space-y-6">
                      {properties.length === 0 ? (
                        <div className="text-center py-8 md:py-12">
                          <Home className="mx-auto h-12 w-12 md:h-16 md:w-16 text-muted-foreground dark:text-gray-400 mb-4" />
                          <h3 className="text-lg md:text-xl font-semibold text-foreground dark:text-white mb-2">No Properties Listed</h3>
                          <p className="text-sm md:text-base text-muted-foreground dark:text-gray-300 mb-6">Start listing your properties to earn money!</p>
                          <Button onClick={() => router.push("/host/properties/new")} className="bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" /> List Your First Property
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3 md:space-y-4">
                          {/* Mobile List View */}
                          <div className="block md:hidden space-y-3">
                            {properties.map((property) => (
                              <Card key={property.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-card/30 backdrop-blur-sm">
                                <div className="flex items-stretch">
                                  <div className="relative w-24 flex-shrink-0">
                                    <div className="aspect-square w-full">
                                      <img
                                        src={property.images[0]}
                                        alt={property.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <Badge className={`absolute top-1 right-1 text-xs px-1 py-0.5 ${
                                      property.status === "LISTED" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                    }`}>
                                      {property.status}
                                    </Badge>
                                  </div>
                                  <div className="flex-1 p-3">
                                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">{property.title}</h3>
                                    <div className="flex items-center gap-1 text-muted-foreground mb-2">
                                      <MapPin className="w-3 h-3" />
                                      <span className="text-xs">{property.location}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-sm">₦{property.price.toLocaleString()}</span>
                                      <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => router.push(`/properties/${property.id}`)}>
                                        <Eye className="w-3 h-3 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                          
                          {/* Desktop Grid View */}
                          <div className="hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {properties.map((property) => (
                              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="h-48 bg-muted">
                                  <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                                </div>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold line-clamp-2">{property.title}</h3>
                                    <Badge className={
                                      property.status === "LISTED" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                      property.status === "SOLD" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                                      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    }>
                                      {property.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">{property.location}</p>
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold">₦{property.price.toLocaleString()}</span>
                                    <Button variant="ghost" size="sm" onClick={() => router.push(`/properties/${property.id}`)}>
                                      View
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
                      {messages.length === 0 ? (
                        <div className="text-center py-8 md:py-12">
                          <MessageSquare className="mx-auto h-12 w-12 md:h-16 md:w-16 text-muted-foreground dark:text-gray-400 mb-4" />
                          <h3 className="text-lg md:text-xl font-semibold text-foreground dark:text-white mb-2">No Messages Yet</h3>
                          <p className="text-sm md:text-base text-muted-foreground dark:text-gray-300">You'll see messages from buyers or sellers here.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 md:space-y-4">
                          {messages.map((message) => (
                            <Card key={message.id} className={message.isRead ? "border-l-4 border-l-muted" : "border-l-4 border-l-primary dark:border-l-blue-500"}>
                              <CardContent className="p-3 md:p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Avatar className="h-6 w-6 md:h-8 md:w-8">
                                        <AvatarFallback className="text-xs">{message.sender.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                      </Avatar>
                                      <h3 className="font-semibold text-sm md:text-base">{message.sender.name}</h3>
                                      {!message.isRead && (
                                        <Badge variant="destructive" className="ml-2 text-xs">New</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs md:text-sm">{message.content}</p>
                                    <p className="text-xs text-muted-foreground mt-2">{new Date(message.createdAt).toLocaleString()}</p>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-xs md:text-sm">Reply</Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === "notifications" && (
                    <div className="space-y-4 md:space-y-6">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 md:py-12">
                          <Bell className="mx-auto h-12 w-12 md:h-16 md:w-16 text-muted-foreground dark:text-gray-400 mb-4" />
                          <h3 className="text-lg md:text-xl font-semibold text-foreground dark:text-white mb-2">No Notifications</h3>
                          <p className="text-sm md:text-base text-muted-foreground dark:text-gray-300">You'll be notified about important updates here.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 md:space-y-4">
                          {notifications.map((notification) => (
                            <Card key={notification.id} className={notification.isRead ? "border-l-4 border-l-muted" : "border-l-4 border-l-primary dark:border-l-blue-500"}>
                              <CardContent className="p-3 md:p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold mb-1 text-sm md:text-base">{notification.title}</h3>
                                    <p className="text-xs md:text-sm mb-2">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
                                  </div>
                                  {!notification.isRead && (
                                    <Badge variant="destructive" className="text-xs">New</Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
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