// app/admin/create-manager/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Mail, Key, Plus, AlertTriangle } from "lucide-react";
import { ProtectedRoute } from "@/lib/auth/protectedRoute";
import { adminService } from "@/lib/api/adminService";
import { toast } from "@/hooks/use-toast";
import { AnimatedBackground } from "@/components/animated-background";

interface CreateManagerForm {
  email: string;
  name: string;
  password: string;
  role: 'PROPERTY_VERIFIER' | 'ESCROW_MANAGER' | 'DISPUTE_RESOLVER' | '';
}

export default function CreateManagerPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateManagerForm>({
    email: '',
    name: '',
    password: '',
    role: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!form.role) {
      newErrors.role = "Please select a manager role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await adminService.createManager({
        email: form.email,
        name: form.name,
        password: form.password,
        role: form.role as 'PROPERTY_VERIFIER' | 'ESCROW_MANAGER' | 'DISPUTE_RESOLVER',
      });

      toast({
        title: "✅ Manager Created!",
        description: `New ${form.role.replace('_', ' ')} created successfully.`,
      });

      // Redirect to Admin Dashboard
      router.push('/admin/dashboard');
    } catch (error: any) {
      toast({
        title: "❌ Creation Failed",
        description: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'PROPERTY_VERIFIER':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Property Verifier</Badge>;
      case 'ESCROW_MANAGER':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Escrow Manager</Badge>;
      case 'DISPUTE_RESOLVER':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Dispute Resolver</Badge>;
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="min-h-screen bg-background dark:bg-gray-900 relative">
        <AnimatedBackground />
        <Header />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto px-6 py-12"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground dark:text-white">Create New Manager</h1>
                <p className="text-muted-foreground dark:text-gray-300">
                  Assign a specialized role to manage properties, escrow, or disputes.
                </p>
              </div>
            </div>
          </div>

          <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground dark:text-white">Manager Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-foreground dark:text-white">
                    Manager Role *
                  </Label>
                  <Select
                    value={form.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a manager role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROPERTY_VERIFIER">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Property Verifier
                        </div>
                      </SelectItem>
                      <SelectItem value="ESCROW_MANAGER">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Escrow Manager
                        </div>
                      </SelectItem>
                      <SelectItem value="DISPUTE_RESOLVER">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Dispute Resolver
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
                  {form.role && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-medium text-foreground dark:text-white mb-2">Role Permissions:</h4>
                      <ul className="text-sm text-muted-foreground dark:text-gray-300 space-y-1">
                        {form.role === 'PROPERTY_VERIFIER' && (
                          <>
                            <li>• Approve/reject property listings</li>
                            <li>• Suspend properties</li>
                            <li>• View property statistics</li>
                          </>
                        )}
                        {form.role === 'ESCROW_MANAGER' && (
                          <>
                            <li>• Release escrow payments</li>
                            <li>• View transaction history</li>
                            <li>• Manage payment disputes</li>
                          </>
                        )}
                        {form.role === 'DISPUTE_RESOLVER' && (
                          <>
                            <li>• Handle user disputes</li>
                            <li>• Escalate to Admin if needed</li>
                            <li>• View chat history</li>
                          </>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground dark:text-white">
                    Full Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="name"
                      placeholder="Enter manager's full name"
                      value={form.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`pl-10 ${errors.name ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground dark:text-white">
                    Email Address *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter manager's email"
                      value={form.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground dark:text-white">
                    Password *
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={form.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`pl-10 ${errors.password ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    Password will be sent to the manager via email. They must change it on first login.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/dashboard')}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Creating...
                      </div>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" /> Create Manager
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}