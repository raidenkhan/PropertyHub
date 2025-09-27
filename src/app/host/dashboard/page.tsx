"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Home, DollarSign, MessageSquare, Clock, CheckCircle, XCircle, Eye, Edit, Trash2, MapPin, Info, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";
import { AnimatedBackground } from "@/components/animated-background";
import { ModeToggle } from "@/components/dashboard/ModeToggle";
import { PayoutDetailsForm } from "@/components/forms/PayoutDetailsForm";
import { 
  useHostDashboard, 
  usePropertyActions, 
  Property 
} from "@/hooks/useHostDashboard";
import { DashboardHeroSkeleton, StatsGridSkeleton, QuickActionsSkeleton, PropertiesGridSkeleton } from "@/components/dashboard/Skeletons";

export default function HostDashboard() {
  const { user, checkUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("listed");
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  const requiresPayoutSetup = !user?.paystackRecipientCode;
  
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

  const handleTabChange = useCallback(async (newTab: string) => {
    setActiveTab(newTab);
    
    if (!user) return;

    const statusMap: Record<string, string> = {
      "listed": "LISTED",
      "pending": "PENDING_VERIFICATION", 
      "drafts": "DRAFT",
      "rejected": "REJECTED",
      "sold": "SOLD",
      "verified":"VERIFIED"
    };

    const status = statusMap[newTab];
    if (status) {
      await fetchPropertiesByStatus(status);
    } else {
      refetch();
    }
  }, [user, fetchPropertiesByStatus, refetch]);

  useEffect(() => {
    if (searchParams.get('action') === 'list-new' && requiresPayoutSetup) {
      setShowPayoutForm(true);
    }
  }, [searchParams, requiresPayoutSetup]);

  const handlePayoutSuccess = () => {
    setShowPayoutForm(false);
    checkUser(); // Re-fetch user data to get the new recipient code
  };

  const getStatusColor = (status: Property["status"]) => {
    switch (status) {
      case "LISTED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "VERIFIED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "PENDING_VERIFICATION":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
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
    if (requiresPayoutSetup) {
      setShowPayoutForm(true);
      return;
    }
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
        refetch();
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

  // Helper function to determine which action buttons to show
  const getPropertyActions = (property: Property) => {
    const actions = [];
    
    switch (property.status) {
      case "DRAFT":
        actions.push(
          { type: "edit", label: "Edit", icon: Edit },
          { type: "submit", label: "Submit", variant: "default" },
          { type: "delete", label: "", icon: Trash2, variant: "ghost" }
        );
        break;
      case "PENDING_VERIFICATION":
        // Only view action for pending properties
        break;
      case "VERIFIED":
        actions.push(
          { type: "list", label: "List Property", variant: "default" }
        );
        break;
      case "LISTED":
        actions.push(
          { type: "delist", label: "Delist", variant: "outline" }
        );
        break;
      case "REJECTED":
        actions.push(
          { type: "edit", label: "Edit", icon: Edit, variant: "outline" },
          { type: "delete", label: "", icon: Trash2, variant: "ghost" }
        );
        break;
      case "SOLD":
        // Only view action for sold properties
        break;
    }
    
    return actions;
  };

  const filteredProperties = properties.filter((property) => {
    switch (activeTab) {
      case "listed":
        return property.status === "LISTED";
      case "verified":
        return property.status==="VERIFIED";
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
      <div className="min-h-screen bg-background dark:bg-gray-900 relative">
        <AnimatedBackground />
        <Header />
        <ModeToggle />
        <DashboardHeroSkeleton />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <StatsGridSkeleton compact />
          <QuickActionsSkeleton count={3} />
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader className="border-b border-border pb-0">
              <CardTitle className="text-xl font-bold text-foreground dark:text-white">Your Properties</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <PropertiesGridSkeleton items={6} />
            </CardContent>
          </Card>
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
    
      <div className="min-h-screen bg-background dark:bg-gray-900 relative">
        <AnimatedBackground />
        <Header />
        <ModeToggle />

        {/* Hero Banner */}
        {showPayoutForm && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowPayoutForm(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <PayoutDetailsForm onSuccess={handlePayoutSuccess} />
            </div>
          </motion.div>
        )}

        {requiresPayoutSetup && !showPayoutForm && (
          <div className="bg-yellow-50 border-b border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/50">
            <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6">
              <div className="flex items-center justify-between flex-wrap">
                <div className="w-0 flex-1 flex items-center">
                  <span className="flex p-2 rounded-lg bg-yellow-100 dark:bg-yellow-500/20">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-300" aria-hidden="true" />
                  </span>
                  <p className="ml-3 font-medium text-yellow-800 dark:text-yellow-200">
                    <span className="md:hidden">Action Required!</span>
                    <span className="hidden md:inline">Action Required: Please set up your payout details before you can list a property.</span>
                  </p>
                </div>
                <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
                  <Button onClick={() => setShowPayoutForm(true)} size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    Setup Payouts
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                <h1 className="text-xl md:text-3xl lg:text-4xl font-bold mb-2">Welcome back, {user?.name?.split(" ")[0] || "Host"}!</h1>
                <p className="text-blue-100 text-sm md:text-lg lg:text-xl max-w-2xl">
                  Manage your properties, track inquiries, and grow your real estate business.
                </p>
              </div>
              <Button
                size="default"
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={handleCreateProperty}
              >
                <Plus className="mr-2 h-4 w-4" /> List New Property
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Stats Cards - 2x2 grid on all screens */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground dark:text-gray-300">Total</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.totalProperties}</p>
                  </div>
                  <Home className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground dark:text-gray-300">Active</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.listedProperties}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground dark:text-gray-300">Pending</p>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.pendingVerification}</p>
                  </div>
                  <Clock className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground dark:text-gray-300">Inquiries</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.totalInquiries}</p>
                  </div>
                  <MessageSquare className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions - 2x2 grid on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8"
          >
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
              <CardContent className="p-3 text-center">
                <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold mb-2">Payouts</h3>
                <Button variant="outline" className="w-full text-xs">
                  View Payouts
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
              <CardContent className="p-3 text-center">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold mb-2">Messages</h3>
                <Button variant="outline" className="w-full text-xs">
                  View Messages
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer col-span-2" onClick={handleCreateProperty}>
              <CardContent className="p-3 text-center">
                <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold mb-2">List Property</h3>
                <Button className="w-full bg-primary hover:bg-primary/90 text-xs">
                  Create Listing
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Help Section */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
                <Info className="h-5 w-5" /> How to Use Your Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground dark:text-gray-300">
              <ul className="list-disc pl-5 space-y-1">
                <li>Use the tabs below to view properties by status (Listed, Pending, Drafts, Rejected, Sold).</li>
                <li>Check the stats cards above to monitor your total properties, active listings, pending verifications, and inquiries.</li>
                <li>Use the quick action buttons to view payouts, messages, or create a new property listing.</li>
                <li>For VERIFIED properties, click "List Property" to make them publicly available for buyers/renters.</li>
                <li>Click on a property to view details, edit, or perform actions like submitting for verification or delisting.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Property Tabs */}
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader className="border-b border-border pb-0">
              <div className="flex flex-col gap-4">
                <CardTitle className="text-xl font-bold text-foreground dark:text-white">Your Properties</CardTitle>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-1 overflow-x-auto">
                    <TabsTrigger value="listed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-2 py-1.5 min-w-[60px]">
                      Listed
                    </TabsTrigger>
                    <TabsTrigger value="verified" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-2 py-1.5 min-w-[60px]">
                      Verified
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-2 py-1.5 min-w-[60px]">
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="drafts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-2 py-1.5 min-w-[60px]">
                      Drafts
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-2 py-1.5 min-w-[60px]">
                      Rejected
                    </TabsTrigger>
                    <TabsTrigger value="sold" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-2 py-1.5 min-w-[60px]">
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
                    <div className="text-center py-8">
                      <Home className="mx-auto h-12 w-12 text-muted-foreground dark:text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                        No {activeTab} properties yet
                      </h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-300 mb-6">
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
                    <>
                      {/* Mobile List View */}
                      <div className="block md:hidden space-y-3">
                        {filteredProperties.map((property, index) => {
                          const actions = getPropertyActions(property);
                          
                          return (
                            <motion.div
                              key={property.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-card/30 backdrop-blur-sm">
                                <div className="flex items-stretch">
                                  <div className="relative w-24 flex-shrink-0">
                                    <div className="aspect-square w-full">
                                      <img
                                        src={property.images?.[0] || "/placeholder-image.png"}
                                        alt={property.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <Badge className={`absolute top-1 right-1 text-xs px-1 py-0.5 ${getStatusColor(property.status)}`}>
                                      {property.status.replace("_", " ")}
                                    </Badge>
                                  </div>
                                  <div className="flex-1 p-3">
                                    <div className="flex justify-between items-start mb-1">
                                      <h3 className="font-semibold text-sm line-clamp-1 flex-1">{property.title}</h3>
                                      <Badge className={`ml-2 text-xs ${getTypeColor(property.type)}`}>
                                        {property.type}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground mb-2">
                                      <MapPin className="w-3 h-3" />
                                      <span className="text-xs line-clamp-1">{property.location}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-bold text-sm">₵{property.price.toLocaleString()}</span>
                                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-xs h-6 px-2 flex-1" 
                                        onClick={() => handleViewProperty(property.id.toString())}
                                      >
                                        <Eye className="w-3 h-3 mr-1" />
                                        View
                                      </Button>
                                      {actions.map((action, actionIndex) => {
                                        if (action.type === "delete") {
                                          return (
                                            <Button 
                                              key={actionIndex}
                                              variant="ghost" 
                                              size="sm" 
                                              className="text-xs h-6 px-1" 
                                              onClick={() => handleDeleteProperty(property.id)}
                                              disabled={actionLoading[property.id.toString()]}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          );
                                        } else if (action.type === "edit") {
                                          return (
                                            <Button 
                                              key={actionIndex}
                                              variant="ghost" 
                                              size="sm" 
                                              className="text-xs h-6 px-2 flex-1" 
                                              onClick={() => handleEditProperty(property.id.toString())}
                                              disabled={actionLoading[property.id.toString()]}
                                            >
                                              <Edit className="w-3 h-3 mr-1" />
                                              {action.label}
                                            </Button>
                                          );
                                        } else {
                                          return (
                                            <Button 
                                              key={actionIndex}
                                              variant={action.variant as any || "outline"} 
                                              size="sm" 
                                              className="text-xs h-6 px-2 flex-1" 
                                              onClick={() => handlePropertyAction(property.id, action.type)}
                                              disabled={actionLoading[property.id.toString()]}
                                            >
                                              {action.label}
                                            </Button>
                                          );
                                        }
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Desktop Grid View */}
                      <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredProperties.map((property, index) => {
                          const actions = getPropertyActions(property);
                          
                          return (
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
                                  <Badge className={getStatusColor(property.status)}>
                                    {property.status.replace("_", " ")}
                                  </Badge>
                                </div>
                              </div>
                              <div className="p-5">
                                <h3 className="font-semibold text-lg text-foreground dark:text-white mb-2 line-clamp-2">
                                  {property.title}
                                </h3>
                                <p className="text-sm text-muted-foreground dark:text-gray-300 mb-3">{property.location}</p>
                                <div className="flex items-center justify-between mb-4">
                                  <span className="text-xl font-bold text-primary">₵{property.price.toLocaleString()}</span>
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
                                  {actions.length > 0 ? (
                                    <div className="flex gap-2 flex-1">
                                      {actions.map((action, actionIndex) => {
                                        if (action.type === "delete") {
                                          return (
                                            <Button
                                              key={actionIndex}
                                              variant="ghost"
                                              size="icon"
                                              className="text-muted-foreground hover:text-red-500"
                                              onClick={() => handleDeleteProperty(property.id)}
                                              disabled={actionLoading[property.id.toString()]}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          );
                                        } else if (action.type === "edit") {
                                          return (
                                            <Button
                                              key={actionIndex}
                                              variant={action.variant as any || "outline"}
                                              size="sm"
                                              className="flex-1"
                                              onClick={() => handleEditProperty(property.id.toString())}
                                              disabled={actionLoading[property.id.toString()]}
                                            >
                                              <Edit className="mr-2 h-3 w-3" /> {action.label}
                                            </Button>
                                          );
                                        } else if (action.type === "submit") {
                                          return (
                                            <Button
                                              key={actionIndex}
                                              variant="default"
                                              size="sm"
                                              className="flex-1"
                                              onClick={() => handlePropertyAction(property.id, "submit")}
                                              disabled={actionLoading[property.id.toString()]}
                                            >
                                              Submit
                                            </Button>
                                          );
                                        } else if (action.type === "list") {
                                          return (
                                            <Button
                                              key={actionIndex}
                                              variant="default"
                                              size="sm"
                                              className="flex-1 bg-green-600 hover:bg-green-700"
                                              onClick={() => handlePropertyAction(property.id, "list")}
                                              disabled={actionLoading[property.id.toString()]}
                                            >
                                              List Property
                                            </Button>
                                          );
                                        } else if (action.type === "delist") {
                                          return (
                                            <Button
                                              key={actionIndex}
                                              variant="outline"
                                              size="sm"
                                              className="flex-1"
                                              onClick={() => handlePropertyAction(property.id, "delist")}
                                              disabled={actionLoading[property.id.toString()]}
                                            >
                                              Delist
                                            </Button>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                  ) : (
                                    // For properties with no actions (like PENDING_VERIFICATION, SOLD), show disabled state
                                    <div className="flex-1 text-center text-xs text-muted-foreground">
                                      {property.status === "PENDING_VERIFICATION" ? "Under Review" : 
                                       property.status === "SOLD" ? "Completed" : "No Actions Available"}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>

  );
}