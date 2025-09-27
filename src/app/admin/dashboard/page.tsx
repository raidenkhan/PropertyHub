// app/admin/dashboard/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, DollarSign, MessageSquare, AlertTriangle, Settings, Plus, Search } from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";
import { AnimatedBackground } from "@/components/animated-background";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock Data — Replace with API calls
const mockUsers = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "USER", status: "ACTIVE", lastLogin: "2025-09-15" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "PROPERTY_VERIFIER", status: "ACTIVE", lastLogin: "2025-09-16" },
  { id: 3, name: "Mike Johnson", email: "mike@example.com", role: "ESCROW_MANAGER", status: "ACTIVE", lastLogin: "2025-09-14" },
  { id: 4, name: "Sarah Wilson", email: "sarah@example.com", role: "DISPUTE_RESOLVER", status: "SUSPENDED", lastLogin: "2025-09-10" },
];

const mockStats = {
  totalUsers: 1247,
  activeProperties: 892,
  pendingVerifications: 45,
  escrowHeld: "₦24,500,000",
  openDisputes: 12,
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  const handleAssignRole = (userId: number, newRole: string) => {
    // Simulate API call
    setUsers(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
    alert(`Role updated to ${newRole} for user ID ${userId}`);
  };

  const handleSuspendUser = (userId: number) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" } : user
      )
    );
    alert(`User ID ${userId} ${users.find(u => u.id === userId)?.status === "ACTIVE" ? "suspended" : "activated"}`);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-gray-300">Loading admin dashboard...</p>
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
          className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 py-8 px-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_50%)]"></div>
          </div>
          <div className="max-w-7xl mx-auto relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-blue-100 text-lg md:text-xl max-w-2xl">
                  Manage users, properties, and system settings — all in one powerful interface.
                </p>
              </div>
              {user?.roles?.includes('SUPER_ADMIN') && (
                <Button
  size="lg"
  className="bg-white text-purple-600 hover:bg-purple-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
  onClick={() => router.push('/admin/create-manager')} 
>
  <Plus className="mr-2 h-5 w-5" /> Create New Manager
</Button>
              )}
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
            {[
              { icon: Users, label: "Total Users", value: mockStats.totalUsers.toLocaleString(), color: "from-blue-500 to-blue-600" },
              { icon: Shield, label: "Active Properties", value: mockStats.activeProperties.toLocaleString(), color: "from-green-500 to-green-600" },
              { icon: DollarSign, label: "Escrow Held", value: mockStats.escrowHeld, color: "from-yellow-500 to-yellow-600" },
              { icon: AlertTriangle, label: "Open Disputes", value: mockStats.openDisputes, color: "from-red-500 to-red-600" },
            ].map((stat, index) => (
              <Card key={index} className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground dark:text-white">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-gradient-to-br ${stat.color} text-white`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Admin Tabs */}
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader className="border-b border-border pb-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-transparent">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    User Management
                  </TabsTrigger>
                  <TabsTrigger value="properties" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Properties
                  </TabsTrigger>
                  <TabsTrigger value="escrow" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Escrow
                  </TabsTrigger>
                  <TabsTrigger value="disputes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Disputes
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
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>System Health</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span>Uptime</span>
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">99.9%</Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Database</span>
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Healthy</Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>API Response</span>
                                <span className="text-sm text-muted-foreground">Avg: 45ms</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-blue-500" />
                                <div>
                                  <p className="font-medium">New Property Listed</p>
                                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-yellow-500" />
                                <div>
                                  <p className="font-medium">Escrow Released</p>
                                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <MessageSquare className="h-5 w-5 text-purple-500" />
                                <div>
                                  <p className="font-medium">Dispute Resolved</p>
                                  <p className="text-xs text-muted-foreground">1 day ago</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* User Management Tab */}
                  {activeTab === "users" && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Select value={selectedRole || ""} onValueChange={(value) => setSelectedRole(value || null)}>
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Filter by role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">All Roles</SelectItem>
                            <SelectItem value="USER">User</SelectItem>
                            <SelectItem value="PROPERTY_VERIFIER">Property Verifier</SelectItem>
                            <SelectItem value="ESCROW_MANAGER">Escrow Manager</SelectItem>
                            <SelectItem value="DISPUTE_RESOLVER">Dispute Resolver</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Last Login</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Badge className={
                                    user.role === 'USER' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                                    user.role === 'PROPERTY_VERIFIER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                    user.role === 'ESCROW_MANAGER' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    user.role === 'DISPUTE_RESOLVER' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                  }>
                                    {user.role.replace('_', ' ')}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={
                                    user.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }>
                                    {user.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{user.lastLogin}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {user.role !== 'SUPER_ADMIN' && (
                                      <Select
                                        value={user.role}
                                        onValueChange={(value) => handleAssignRole(user.id, value)}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="USER">User</SelectItem>
                                          <SelectItem value="PROPERTY_VERIFIER">Property Verifier</SelectItem>
                                          <SelectItem value="ESCROW_MANAGER">Escrow Manager</SelectItem>
                                          <SelectItem value="DISPUTE_RESOLVER">Dispute Resolver</SelectItem>
                                          {user.role?.includes('SUPER_ADMIN') && (
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-700"
                                      onClick={() => handleSuspendUser(user.id)}
                                    >
                                      {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Properties Tab */}
                  {activeTab === "properties" && (
                    <div className="text-center py-12">
                      <Shield className="mx-auto h-16 w-16 text-muted-foreground dark:text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">Property Management</h3>
                      <p className="text-muted-foreground dark:text-gray-300 mb-6">
                        View and manage all properties, including pending verifications and suspended listings.
                      </p>
                      <Button onClick={() => router.push('/admin/properties')}>View Properties</Button>
                    </div>
                  )}

                  {/* Escrow Tab */}
                  {activeTab === "escrow" && (
                    <div className="text-center py-12">
                      <DollarSign className="mx-auto h-16 w-16 text-muted-foreground dark:text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">Escrow Management</h3>
                      <p className="text-muted-foreground dark:text-gray-300 mb-6">
                        Review and release escrow payments for completed transactions.
                      </p>
                      <Button onClick={() => router.push('/admin/escrow')}>Manage Escrow</Button>
                    </div>
                  )}

                  {/* Disputes Tab */}
                  {activeTab === "disputes" && (
                    <div className="text-center py-12">
                      <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground dark:text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">Dispute Resolution</h3>
                      <p className="text-muted-foreground dark:text-gray-300 mb-6">
                        Handle and resolve user disputes with full context and history.
                      </p>
                      <Button onClick={() => router.push('/admin/disputes')}>View Disputes</Button>
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