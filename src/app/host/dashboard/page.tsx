// app/host/dashboard/page.tsx
"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Home, DollarSign, MessageSquare, Clock, CheckCircle, XCircle, Eye, Edit, Trash2 } from "lucide-react";
import { ProtectedRoute } from "@/lib/auth/protectedRoute";
import { useAuth } from "@/lib/auth/authContext";
import { AnimatedBackground } from "@/components/animated-background";
import { 
  useHostDashboard, 
  usePropertyActions, 
  Property 
} from "@/hooks/useHostDashboard";

export default function HostDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("listed");
  
  // Use the integrated hooks
  const { 
    properties, 
    stats, 
    loading: dashboardLoading, 
    error: dashboardError, 
    refetch,
    fetchPropertiesByStatus 
  } = useHostDashboard();
  
  const { 
    deleteProperty, 
    listProperty, 
    delistProperty, 
    submitForVerification, 
    loading: actionLoading 
  } = usePropertyActions();

  // Handle tab changes - fetch data when tab changes
  const handleTabChange = useCallback(async (newTab: string) => {
    setActiveTab(newTab);
    
    if (!user) return;

    const statusMap: Record<string, string> = {
      "listed": "LISTED",
      "pending": "PENDING_VERIFICATION", 
      "drafts": "DRAFT",
      "rejected": "REJECTED",
      "sold": "SOLD"
    };

    const status = statusMap[newTab];
    if (status) {
      await fetchPropertiesByStatus(status);
    } else {
      // For "all" or default, refetch all properties
      refetch();
    }
  }, [user, fetchPropertiesByStatus, refetch]);

  const getStatusColor = (status: Property["status"]) => {
    switch (status) {
      case "LISTED":
      case "VERIFIED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PENDING_VERIFICATION":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "DRAFT":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "SOLD":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getTypeColor = (type: Property["type"]) => {
    switch (type) {
      case "SELL":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "RENT":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "LEASE":
        return "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200";
      case "STAY":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const handleCreateProperty = () => {
    router.push("/host/properties/new");
  };

  const handleEditProperty = (id: string) => {
    router.push(`/host/properties/${id}/edit`);
  };

  const handleViewProperty = (id: string) => {
    router.push(`/properties/${id}`);
  };

  const handleDeleteProperty = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      await deleteProperty(id, () => {
        refetch(); // Refresh the dashboard data
      });
    }
  };

  const handlePropertyAction = async (propertyId: number, action: string) => {
    try {
      switch (action) {
        case "list":
          await listProperty(propertyId, () => refetch());
          break;
        case "delist":
          await delistProperty(propertyId, () => refetch());
          break;
        case "submit":
          await submitForVerification(propertyId, () => refetch());
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} property:`, error);
    }
  };

  const filteredProperties = properties.filter((property) => {
    switch (activeTab) {
      case "listed":
        return property.status === "LISTED" || property.status === "VERIFIED";
      case "pending":
        return property.status === "PENDING_VERIFICATION";
      case "drafts":
        return property.status === "DRAFT";
      case "rejected":
        return property.status === "REJECTED";
      case "sold":
        return property.status === "SOLD";
      default:
        return true;
    }
  });

  if (dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">Failed to Load Dashboard</h2>
          <p className="text-muted-foreground dark:text-gray-300 mb-6">{dashboardError}</p>
          <Button onClick={refetch} className="bg-primary hover:bg-primary/90">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background dark:bg-gray-900 relative">
        <AnimatedBackground />
        <Header />

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-600 py-8 px-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_50%)]"></div>
          </div>
          <div className="max-w-7xl mx-auto relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {user?.name?.split(" ")[0] || "Host"} 🏡</h1>
                <p className="text-blue-100 text-lg md:text-xl max-w-2xl">
                  Manage your properties, track inquiries, and grow your real estate business — all in one place.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={handleCreateProperty}
              >
                <Plus className="mr-2 h-5 w-5" /> List New Property
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Total Listings</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProperties}</p>
                  </div>
                  <Home className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Active Listings</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.listedProperties}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Pending Review</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.pendingVerification}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Total Inquiries</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalInquiries}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Property Tabs */}
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader className="border-b border-border pb-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-2xl font-bold text-foreground dark:text-white">Your Properties</CardTitle>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
                  <TabsList className="grid w-full grid-cols-5 sm:w-auto sm:grid-cols-5 gap-1 bg-transparent">
                    <TabsTrigger value="listed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Listed
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="drafts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Drafts
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Rejected
                    </TabsTrigger>
                    <TabsTrigger value="sold" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Sold
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
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
                  {filteredProperties.length === 0 ? (
                    <div className="text-center py-12">
                      <Home className="mx-auto h-16 w-16 text-muted-foreground dark:text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
                        No {activeTab} properties yet
                      </h3>
                      <p className="text-muted-foreground dark:text-gray-300 mb-6">
                        {activeTab === "listed"
                          ? "List your first property to start earning!"
                          : activeTab === "pending"
                          ? "Your listings are under review. Check back soon!"
                          : activeTab === "drafts"
                          ? "Continue editing your draft properties."
                          : activeTab === "rejected"
                          ? "Review feedback and resubmit your properties."
                          : "Congratulations on your sold properties!"}
                      </p>
                      {activeTab === "drafts" && (
                        <Button onClick={handleCreateProperty} className="bg-primary hover:bg-primary/90">
                          <Plus className="mr-2 h-4 w-4" /> Create New Draft
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredProperties.map((property, index) => (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="group bg-white dark:bg-gray-800 rounded-xl border border-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                        >
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={property.images?.[0] || "/placeholder-image.png"}
                              alt={property.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-4 left-4">
                              <Badge className={getTypeColor(property.type)}>{property.type}</Badge>
                            </div>
                            <div className="absolute top-4 right-4">
                              <Badge className={getStatusColor(property.status)}>{property.status.replace("_", " ")}</Badge>
                            </div>
                          </div>
                          <div className="p-5">
                            <h3 className="font-semibold text-lg text-foreground dark:text-white mb-2 line-clamp-2">
                              {property.title}
                            </h3>
                            <p className="text-sm text-muted-foreground dark:text-gray-300 mb-3">{property.location}</p>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xl font-bold text-primary">₦{property.price.toLocaleString()}</span>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span>0</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>0</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleViewProperty(property.id.toString())}
                              >
                                <Eye className="mr-2 h-3 w-3" /> View
                              </Button>
                             {property.status === "DRAFT" ? (
  <div className="flex gap-2 flex-1">
    <Button
      variant="outline"
      size="sm"
      className="flex-1"
      onClick={() => handleEditProperty(property.id.toString())}
      disabled={actionLoading[property.id.toString()]}
    >
      <Edit className="mr-2 h-3 w-3" /> Edit
    </Button>
    <Button
      variant="default"
      size="sm"
      className="flex-1"
      onClick={() => handlePropertyAction(property.id, "submit")}
      disabled={actionLoading[property.id.toString()]}
    >
      Submit for Verification
    </Button>
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-red-500"
      onClick={() => handleDeleteProperty(property.id)}
      disabled={actionLoading[property.id.toString()]}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
                              ) : property.status === "REJECTED" ? (
                                <div className="flex gap-2 flex-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleEditProperty(property.id.toString())}
                                    disabled={actionLoading[property.id.toString()]}
                                  >
                                    <Edit className="mr-2 h-3 w-3" /> Edit
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handlePropertyAction(property.id, "submit")}
                                    disabled={actionLoading[property.id.toString()]}
                                  >
                                    Submit
                                  </Button>
                                </div>
                              ) : property.status === "LISTED" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handlePropertyAction(property.id, "delist")}
                                  disabled={actionLoading[property.id.toString()]}
                                >
                                  Delist
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-red-500"
                                  onClick={() => handleDeleteProperty(property.id)}
                                  disabled={actionLoading[property.id.toString()]}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">Manage Payouts</h3>
                <p className="text-sm text-muted-foreground dark:text-gray-300 mb-4">
                  Track escrow releases and request payouts for completed transactions.
                </p>
                <Button variant="outline" className="w-full">
                  View Payouts
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-12 w-12 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">Messages</h3>
                <p className="text-sm text-muted-foreground dark:text-gray-300 mb-4">
                  Chat with potential buyers or renters. All messages are monitored for safety.
                </p>
                <Button variant="outline" className="w-full">
                  View Messages
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <Plus className="h-12 w-12 text-purple-500 dark:text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">List New Property</h3>
                <p className="text-sm text-muted-foreground dark:text-gray-300 mb-4">
                  Add a new property for sale, rent, lease, or short-term stay.
                </p>
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleCreateProperty}>
                  Create Listing
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}