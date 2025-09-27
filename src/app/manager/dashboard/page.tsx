// app/manager/dashboard/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, DollarSign, MessageSquare, AlertTriangle, Users, Eye, CheckCircle, XCircle, ArrowUp, AlertCircle, Search } from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";
import { AnimatedBackground } from "@/components/animated-background";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { managerService } from "@/lib/api/managerService";
import { Label } from "@radix-ui/react-dropdown-menu";
import { SkeletonLoader } from "@/components/skeletonLoader";

// Types
interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  type: string;
  currentOwner: { name: string; email: string };
  createdAt: string;
}

interface Transaction {
  id: number;
  amount: number;
  status: string;
  buyer: { name: string };
  seller: { name: string };
  property: { title: string };
  createdAt: string;
}

interface Dispute {
  id: number;
  title: string;
  status: string;
  complainant: { name: string };
  respondent: { name: string };
  property?: { title: string };
  transaction?: { id: number };
  createdAt: string;
}

interface Chat {
  id: number;
  sender: { name: string };
  receiver: { name: string };
  message: string;
  isReported: boolean;
  createdAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  status: string;
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingProperties: 0,
    escrowTransactions: 0,
    openDisputes: 0,
    reportedChats: 0,
  });

  // Property Verifier
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");

  // Escrow Manager
  const [escrowTransactions, setEscrowTransactions] = useState<Transaction[]>([]);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Dispute Resolver
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState("");

  // User Management
  const [users, setUsers] = useState<User[]>([]);
  const [showSuspendUserModal, setShowSuspendUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Chat Monitoring
  const [reportedChats, setReportedChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch stats
        const [pendingRes, escrowRes, disputesRes, chatsRes] = await Promise.all([
          managerService.getPendingProperties().catch(() => ({ data: [] })),
          managerService.getEscrowTransactions().catch(() => ({ data: [] })),
          managerService.getDisputes().catch(() => ({ data: [] })),
          managerService.getReportedChats().catch(() => ({ data: [] })),
        ]);

        setStats({
          pendingProperties: pendingRes.data.length,
          escrowTransactions: escrowRes.data.length,
          openDisputes: disputesRes.data.length,
          reportedChats: chatsRes.data.length,
        });

        // Fetch data based on role
        if (user?.roles?.includes('PROPERTY_VERIFIER')) {
          setPendingProperties(pendingRes.data);
     
        }
        if (user?.roles?.includes('ESCROW_MANAGER')) {
          setEscrowTransactions(escrowRes.data);
        }
        if (user?.roles?.includes('DISPUTE_RESOLVER')) {
          setDisputes(disputesRes.data);
        }
        if (user?.roles?.some(r => ['PROPERTY_VERIFIER', 'DISPUTE_RESOLVER'].includes(r))) {
          setReportedChats(chatsRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: "❌ Load Failed",
          description: "Some data could not be loaded. Please refresh.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
      
    }
  }, [user]);

  // Add this after your state declarations
useEffect(() => {
  console.log('📊 pendingProperties State Updated:', pendingProperties);
}, [pendingProperties]);

  // Property Verifier Actions
  const handleApproveProperty = async (property: Property) => {
    setSelectedProperty(property);
    setShowApproveModal(true);
  };

  const handleRejectProperty = async (property: Property) => {
    setSelectedProperty(property);
    setShowRejectModal(true);
  };

  const handleSuspendProperty = async (property: Property) => {
    setSelectedProperty(property);
    setShowSuspendModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedProperty) return;
    try {
      await managerService.approveProperty(selectedProperty.id, notes);
      toast({
        title: "✅ Property Approved",
        description: `${selectedProperty.title} is now live!`,
      });
      setPendingProperties(prev => prev.filter(p => p.id !== selectedProperty.id));
      setShowApproveModal(false);
      setNotes("");
    } catch (error: any) {
      toast({
        title: "❌ Approval Failed",
        description: error.message,
      });
    }
  };

  const confirmReject = async () => {
    if (!selectedProperty || !notes) {
      toast({
        title: "❌ Invalid Input",
        description: "Please provide rejection notes.",
      });
      return;
    }
    try {
      await managerService.rejectProperty(selectedProperty.id, notes);
      toast({
        title: "✅ Property Rejected",
        description: `${selectedProperty.title} has been rejected.`,
      });
      setPendingProperties(prev => prev.filter(p => p.id !== selectedProperty.id));
      setShowRejectModal(false);
      setNotes("");
    } catch (error: any) {
      toast({
        title: "❌ Rejection Failed",
        description: error.message,
      });
    }
  };

  const confirmSuspend = async () => {
    if (!selectedProperty || !reason) {
      toast({
        title: "❌ Invalid Input",
        description: "Please provide suspension reason.",
      });
      return;
    }
    try {
      await managerService.suspendProperty(selectedProperty.id, reason);
      toast({
        title: "✅ Property Suspended",
        description: `${selectedProperty.title} has been suspended.`,
      });
      setPendingProperties(prev => prev.filter(p => p.id !== selectedProperty.id));
      setShowSuspendModal(false);
      setReason("");
    } catch (error: any) {
      toast({
        title: "❌ Suspension Failed",
        description: error.message,
      });
    }
  };

  // Escrow Manager Actions
  const handleReleaseEscrow = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReleaseModal(true);
  };

  const confirmReleaseEscrow = async () => {
    if (!selectedTransaction) return;
    try {
      await managerService.releaseEscrow(selectedTransaction.id, notes);
      toast({
        title: "✅ Escrow Released",
        description: `₦${selectedTransaction.amount.toLocaleString()} released to seller.`,
      });
      setEscrowTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
      setShowReleaseModal(false);
      setNotes("");
    } catch (error: any) {
      toast({
        title: "❌ Release Failed",
        description: error.message,
      });
    }
  };

  // Dispute Resolver Actions
  const handleResolveDispute = async (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowResolveModal(true);
  };

  const handleEscalateDispute = async (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowEscalateModal(true);
  };

  const confirmResolve = async () => {
    if (!selectedDispute || !resolution) {
      toast({
        title: "❌ Invalid Input",
        description: "Please provide resolution details.",
      });
      return;
    }
    try {
      await managerService.resolveDispute(selectedDispute.id, resolution);
      toast({
        title: "✅ Dispute Resolved",
        description: `Dispute "${selectedDispute.title}" has been resolved.`,
      });
      setDisputes(prev => prev.filter(d => d.id !== selectedDispute.id));
      setShowResolveModal(false);
      setResolution("");
    } catch (error: any) {
      toast({
        title: "❌ Resolution Failed",
        description: error.message,
      });
    }
  };

  const confirmEscalate = async () => {
    if (!selectedDispute || !reason) {
      toast({
        title: "❌ Invalid Input",
        description: "Please provide escalation reason.",
      });
      return;
    }
    try {
      await managerService.escalateDispute(selectedDispute.id, reason);
      toast({
        title: "✅ Dispute Escalated",
        description: `Dispute "${selectedDispute.title}" escalated to Admin.`,
      });
      setDisputes(prev => prev.filter(d => d.id !== selectedDispute.id));
      setShowEscalateModal(false);
      setReason("");
    } catch (error: any) {
      toast({
        title: "❌ Escalation Failed",
        description: error.message,
      });
    }
  };

  // User Management Actions
  const handleSuspendUser = async (user: User) => {
    setSelectedUser(user);
    setShowSuspendUserModal(true);
  };

  const confirmSuspendUser = async () => {
    if (!selectedUser || !reason) {
      toast({
        title: "❌ Invalid Input",
        description: "Please provide suspension reason.",
      });
      return;
    }
    try {
      await managerService.suspendUser(selectedUser.id, reason);
      toast({
        title: "✅ User Suspended",
        description: `${selectedUser.name} has been suspended.`,
      });
      // In real app, update user list
      setShowSuspendUserModal(false);
      setReason("");
    } catch (error: any) {
      toast({
        title: "❌ Suspension Failed",
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    
      <div className="min-h-screen bg-background dark:bg-gray-900 relative">
        <AnimatedBackground />
        <Header />

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-8 px-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_50%)]"></div>
          </div>
          <div className="max-w-7xl mx-auto relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Manager Dashboard</h1>
                <p className="text-blue-100 text-lg md:text-xl max-w-2xl">
                  {user?.roles?.includes('PROPERTY_VERIFIER') && "Approve/reject property listings"}
                  {user?.roles?.includes('ESCROW_MANAGER') && "Manage escrow payments"}
                  {user?.roles?.includes('DISPUTE_RESOLVER') && "Resolve user disputes"}
                  {(user?.roles && (user?.roles.length > 1 ))&& "Manage all your assigned responsibilities"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {user?.roles?.map(role => (
                  <Badge key={role} className="bg-white/20 text-white">
                    {role.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
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
            {user?.roles?.includes('PROPERTY_VERIFIER') && (
              <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Pending Properties</p>
                      <p className="text-3xl font-bold text-foreground dark:text-white">{stats.pendingProperties}</p>
                    </div>
                    <Home className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            )}

            {user?.roles?.includes('ESCROW_MANAGER') && (
              <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Escrow Transactions</p>
                      <p className="text-3xl font-bold text-foreground dark:text-white">{stats.escrowTransactions}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>
            )}

            {user?.roles?.includes('DISPUTE_RESOLVER') && (
              <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Open Disputes</p>
                      <p className="text-3xl font-bold text-foreground dark:text-white">{stats.openDisputes}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500 dark:text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            )}

            {(user?.roles?.includes('PROPERTY_VERIFIER') || user?.roles?.includes('DISPUTE_RESOLVER')) && (
              <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Reported Chats</p>
                      <p className="text-3xl font-bold text-foreground dark:text-white">{stats.reportedChats}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Manager Tabs */}
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader className="border-b border-border pb-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-transparent">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
    Overview
  </TabsTrigger>
                  {user?.roles?.includes('PROPERTY_VERIFIER') && (
                    <TabsTrigger value="properties" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Properties
                    </TabsTrigger>
                  )}
                  {user?.roles?.includes('ESCROW_MANAGER') && (
                    <TabsTrigger value="escrow" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Escrow
                    </TabsTrigger>
                  )}
                  {user?.roles?.includes('DISPUTE_RESOLVER') && (
                    <TabsTrigger value="disputes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Disputes
                    </TabsTrigger>
                  )}
                  {(user?.roles?.includes('PROPERTY_VERIFIER') || user?.roles?.includes('DISPUTE_RESOLVER')) && (
                    <TabsTrigger value="chats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Chats
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-6">
              
  {activeTab === "overview" && (
    <div className="space-y-8">
      <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <Users className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-4">
              Welcome, {user?.name || 'Manager'}!
            </h2>
            <p className="text-muted-foreground dark:text-gray-300 max-w-md">
              You have {stats.pendingProperties} pending properties, {stats.escrowTransactions} escrow transactions, 
              and {stats.openDisputes} open disputes awaiting your attention.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Optional: Mini stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user?.roles?.includes('PROPERTY_VERIFIER') && (
          <Card className="border-0 shadow-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Pending Properties</p>
                  <p className="text-2xl font-bold text-foreground dark:text-white">{stats.pendingProperties}</p>
                </div>
                <Home className="h-6 w-6 text-blue-500" />
              </div>
              <Button
                variant="link"
                className="p-0 h-auto text-primary hover:text-primary/80 mt-3"
                onClick={() => setActiveTab("properties")}
              >
                View All →
              </Button>
            </CardContent>
          </Card>
        )}

        {user?.roles?.includes('ESCROW_MANAGER') && (
          <Card className="border-0 shadow-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Escrow Transactions</p>
                  <p className="text-2xl font-bold text-foreground dark:text-white">{stats.escrowTransactions}</p>
                </div>
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <Button
                variant="link"
                className="p-0 h-auto text-primary hover:text-primary/80 mt-3"
                onClick={() => setActiveTab("escrow")}
              >
                View All →
              </Button>
            </CardContent>
          </Card>
        )}

        {user?.roles?.includes('DISPUTE_RESOLVER') && (
          <Card className="border-0 shadow-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Open Disputes</p>
                  <p className="text-2xl font-bold text-foreground dark:text-white">{stats.openDisputes}</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <Button
                variant="link"
                className="p-0 h-auto text-primary hover:text-primary/80 mt-3"
                onClick={() => setActiveTab("disputes")}
              >
                View All →
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )}

  
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Properties Tab */}
                {activeTab === "properties" && user?.roles?.includes('PROPERTY_VERIFIER') && (
  <div className="space-y-6">
    {isLoading ? (
      <SkeletonLoader rows={5} cols={6} />
    ) : pendingProperties.length === 0 ? (
      <div className="text-center py-12">
        <Home className="mx-auto h-16 w-16 text-muted-foreground dark:text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">No Pending Properties</h3>
        <p className="text-muted-foreground dark:text-gray-300">All properties have been reviewed.</p>
      </div>
    ) : (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingProperties.map((property) => (
              <TableRow key={property.id}>
                <TableCell className="font-medium">{property.title}</TableCell>
                <TableCell>{property.location}</TableCell>
                <TableCell>₦{property.price.toLocaleString()}</TableCell>
                <TableCell>{property.currentOwner?.name || 'N/A'}</TableCell>
                <TableCell>{new Date(property.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300"
                      onClick={() => handleApproveProperty(property)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                      onClick={() => handleRejectProperty(property)}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300"
                      onClick={() => handleSuspendProperty(property)}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" /> Suspend
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}
  </div>
)}

                  {/* Escrow Tab */}
                  {activeTab === "escrow" && user?.roles?.includes('ESCROW_MANAGER') && (
                    <div className="space-y-6">
                      {escrowTransactions.length === 0 ? (
                        <div className="text-center py-12">
                          <DollarSign className="mx-auto h-16 w-16 text-muted-foreground dark:text-gray-400 mb-4" />
                          <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">No Escrow Transactions</h3>
                          <p className="text-muted-foreground dark:text-gray-300">No transactions awaiting escrow release.</p>
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Buyer</TableHead>
                                <TableHead>Seller</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {escrowTransactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                  <TableCell className="font-medium">{transaction.property.title}</TableCell>
                                  <TableCell>₦{transaction.amount.toLocaleString()}</TableCell>
                                  <TableCell>{transaction.buyer.name}</TableCell>
                                  <TableCell>{transaction.seller.name}</TableCell>
                                  <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300"
                                      onClick={() => handleReleaseEscrow(transaction)}
                                    >
                                      <ArrowUp className="h-4 w-4 mr-1" /> Release
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Disputes Tab */}
                  {activeTab === "disputes" && user?.roles?.includes('DISPUTE_RESOLVER') && (
                    <div className="space-y-6">
                      {disputes.length === 0 ? (
                        <div className="text-center py-12">
                          <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground dark:text-gray-400 mb-4" />
                          <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">No Open Disputes</h3>
                          <p className="text-muted-foreground dark:text-gray-300">All disputes have been resolved.</p>
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Parties</TableHead>
                                <TableHead>Property</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Reported</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {disputes.map((dispute) => (
                                <TableRow key={dispute.id}>
                                  <TableCell className="font-medium">{dispute.title}</TableCell>
                                  <TableCell>
                                    {dispute.complainant.name} vs {dispute.respondent.name}
                                  </TableCell>
                                  <TableCell>{dispute.property?.title || 'N/A'}</TableCell>
                                  <TableCell>
                                    <Badge className={
                                      dispute.status === 'OPEN' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                      dispute.status === 'IN_REVIEW' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    }>
                                      {dispute.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{new Date(dispute.createdAt).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300"
                                        onClick={() => handleResolveDispute(dispute)}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300"
                                        onClick={() => handleEscalateDispute(dispute)}
                                      >
                                        <AlertTriangle className="h-4 w-4 mr-1" /> Escalate
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chats Tab */}
                  {activeTab === "chats" && (user?.roles?.includes('PROPERTY_VERIFIER') || user?.roles?.includes('DISPUTE_RESOLVER')) && (
                    <div className="space-y-6">
                      <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search chats..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {reportedChats.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground dark:text-gray-400 mb-4" />
                          <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">No Reported Chats</h3>
                          <p className="text-muted-foreground dark:text-gray-300">No chats have been reported by users.</p>
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Sender</TableHead>
                                <TableHead>Receiver</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reportedChats
                                .filter(chat =>
                                  chat.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  chat.receiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  chat.message.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((chat) => (
                                  <TableRow key={chat.id}>
                                    <TableCell className="font-medium">{chat.sender.name}</TableCell>
                                    <TableCell>{chat.receiver.name}</TableCell>
                                    <TableCell className="max-w-xs truncate">{chat.message}</TableCell>
                                    <TableCell>{new Date(chat.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                                        onClick={() => handleSuspendUser({ id: 0, name: chat.sender.name, email: '', status: 'ACTIVE' })}
                                      >
                                        <AlertCircle className="h-4 w-4 mr-1" /> Suspend User
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        {/* Approve Property Modal */}
        <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Property</DialogTitle>
            </DialogHeader>
            <div>
              <p className="mb-4">Are you sure you want to approve "<span className="font-medium">{selectedProperty?.title}</span>"?</p>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add approval notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveModal(false)}>Cancel</Button>
              <Button onClick={confirmApprove}>Approve Property</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Property Modal */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Property</DialogTitle>
            </DialogHeader>
            <div>
              <p className="mb-4">Are you sure you want to reject "<span className="font-medium">{selectedProperty?.title}</span>"?</p>
              <Label>Rejection Reason *</Label>
              <Textarea
                placeholder="Explain why this property is being rejected..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button onClick={confirmReject} variant="destructive">Reject Property</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend Property Modal */}
        <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend Property</DialogTitle>
            </DialogHeader>
            <div>
              <p className="mb-4">Are you sure you want to suspend "<span className="font-medium">{selectedProperty?.title}</span>"?</p>
              <Label>Suspension Reason *</Label>
              <Textarea
                placeholder="Explain why this property is being suspended..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSuspendModal(false)}>Cancel</Button>
              <Button onClick={confirmSuspend} variant="destructive">Suspend Property</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Release Escrow Modal */}
        <Dialog open={showReleaseModal} onOpenChange={setShowReleaseModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Release Escrow</DialogTitle>
            </DialogHeader>
            <div>
              <p className="mb-4">Release ₦{selectedTransaction?.amount.toLocaleString()} to seller "<span className="font-medium">{selectedTransaction?.seller.name}</span>" for property "<span className="font-medium">{selectedTransaction?.property.title}</span>"?</p>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add release notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReleaseModal(false)}>Cancel</Button>
              <Button onClick={confirmReleaseEscrow}>Release Escrow</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resolve Dispute Modal */}
        <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Dispute</DialogTitle>
            </DialogHeader>
            <div>
              <p className="mb-4">Resolve dispute "<span className="font-medium">{selectedDispute?.title}</span>"?</p>
              <Label>Resolution Details *</Label>
              <Textarea
                placeholder="Describe how this dispute was resolved..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResolveModal(false)}>Cancel</Button>
              <Button onClick={confirmResolve}>Resolve Dispute</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Escalate Dispute Modal */}
        <Dialog open={showEscalateModal} onOpenChange={setShowEscalateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Escalate Dispute</DialogTitle>
            </DialogHeader>
            <div>
              <p className="mb-4">Escalate dispute "<span className="font-medium">{selectedDispute?.title}</span>" to Admin?</p>
              <Label>Escalation Reason *</Label>
              <Textarea
                placeholder="Explain why this dispute needs admin intervention..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEscalateModal(false)}>Cancel</Button>
              <Button onClick={confirmEscalate} variant="destructive">Escalate to Admin</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend User Modal */}
        <Dialog open={showSuspendUserModal} onOpenChange={setShowSuspendUserModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend User</DialogTitle>
            </DialogHeader>
            <div>
              <p className="mb-4">Suspend user "<span className="font-medium">{selectedUser?.name}</span>"?</p>
              <Label>Suspension Reason *</Label>
              <Textarea
                placeholder="Explain why this user is being suspended..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSuspendUserModal(false)}>Cancel</Button>
              <Button onClick={confirmSuspendUser} variant="destructive">Suspend User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  );
}