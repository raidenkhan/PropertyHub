"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Building2, Sparkles, Shield, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Header } from '@/components/Header';
import { AnimatedBackground } from '@/components/animated-background';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { useAuth } from '@/lib/auth/authContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    acceptTerms: false,
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // ✅ Get user from auth context
  const { login, signup, isLoading, user, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!isLogin && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation (signup only)
    if (!isLogin) {
      if (!formData.name.trim()) {
        errors.name = 'Full name is required';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.acceptTerms) {
        errors.acceptTerms = 'You must accept the terms and conditions';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.email, formData.password, formData.name, formData.phone);
      }
      
      // ✅ Success will be handled in useEffect when user state updates
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    }
  };

  // ✅ Handle redirect after successful authentication
  useEffect(() => {
    if (user && !isLoading) {
      // Show success message with user info
      if (user.roles?.length) {
        const primaryRole = user.roles[0];
        toast.success(`Welcome back, ${user.name}! Redirecting to your ${primaryRole} dashboard.`);
      } else {
        toast.success(`Welcome back, ${user.name}!`);
      }
      
      console.log("User: ", user);
      const redirectPath = user.redirectPath || '/';
      console.log("Redirect Path: ", redirectPath);
      
      // Small delay to show the toast before redirecting
      setTimeout(() => {
        router.push(redirectPath);
      }, 1000);
    }
  }, [user, isLoading, router]);

  const toggleMode = (mode: boolean) => {
    setIsLogin(mode);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
      acceptTerms: false,
      rememberMe: false
    });
    setError(null);
    setValidationErrors({});
  };

  return (
    
     <>
      {/* Header */}
      <Header />
      
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br bg-background dark:bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Enhanced Animated Background */}
        <AnimatedBackground />
        
        {/* Additional floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-purple-400/20 to-pink-400/20 blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-gradient-to-r from-indigo-400/10 to-cyan-400/10 blur-3xl animate-pulse delay-500"></div>
          
          {/* Animated particles */}
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-500/40 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
          
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center relative z-10">
          {/* Left Side - Hero Section */}
          <div className="hidden lg:block space-y-8 p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PropertyHub</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Real Estate Marketplace</p>
                </div>
              </div>

              <h2 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                Discover Your Dream Property
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Join thousands of users finding their perfect homes, offices, and investment opportunities across Nigeria.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">50K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Properties Listed
                </div>
              </div>
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">15K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Happy Customers
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4 pt-8">
              {[
                { icon: Sparkles, text: "AI-Powered Property Recommendations" },
                { icon: Shield, text: "Secure & Verified Listings" },
                { icon: Users, text: "Connect with Trusted Agents" }
              ].map(({ icon: Icon, text }, index) => (
                <div key={index} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Auth Form with Tabs */}
          <div className="w-full mx-auto p-4 relative z-10">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-white/20 dark:border-gray-700/30 rounded-xl shadow-2xl overflow-hidden">
              {/* Tab navigation */}
              <div className="grid grid-cols-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                <button
                  className={`py-4 px-6 transition-colors duration-200 ${isLogin ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-b-2 border-blue-600 dark:border-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => toggleMode(true)}
                >
                  Sign In
                </button>
                <button
                  className={`py-4 px-6 transition-colors duration-200 ${!isLogin ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-b-2 border-blue-600 dark:border-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => toggleMode(false)}
                >
                  Sign Up
                </button>
              </div>

              <div className="p-8">
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                  {isLogin ? 'Sign In to PropertyHub' : 'Create Account'}
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                  {isLogin ? 'Welcome back! Please sign in to your account.' : 'Join PropertyHub and discover your dream property'}
                </p>

                {/* Error Display */}
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Auth Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={`pl-10 h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 ${validationErrors.name ? 'border-red-500' : ''}`}
                          required={!isLogin}
                        />
                        {validationErrors.name && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 font-medium">
                          Phone Number
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="Enter your phone number"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className={`pl-10 h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 ${validationErrors.phone ? 'border-red-500' : ''}`}
                          />
                          {validationErrors.phone && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`pl-10 h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 ${validationErrors.email ? 'border-red-500' : ''}`}
                        required
                      />
                      {validationErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`pl-10 pr-10 h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 ${validationErrors.password ? 'border-red-500' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {validationErrors.password && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
                      )}
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 font-medium">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className={`pl-10 pr-10 h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                          required={!isLogin}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {validationErrors.confirmPassword && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Checkboxes */}
                  {isLogin && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={formData.rememberMe}
                        onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                        className="border-gray-300 dark:border-gray-600"
                      />
                      <Label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-400">
                        Remember me for 30 days
                      </Label>
                    </div>
                  )}

                  {!isLogin && (
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="acceptTerms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                        className={`border-gray-300 dark:border-gray-600 mt-0.5 ${validationErrors.acceptTerms ? 'border-red-500' : ''}`}
                        required
                      />
                      <div className="flex-1">
                        <Label htmlFor="acceptTerms" className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          I agree to the{" "}
                          <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                            Privacy Policy
                          </a>
                        </Label>
                        {validationErrors.acceptTerms && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.acceptTerms}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        {isLogin ? 'Signing In...' : 'Creating Account...'}
                      </div>
                    ) : (
                      isLogin ? 'Sign In' : 'Create Account'
                    )}
                  </Button>

                  {isLogin && (
                    <div className="text-center mt-4">
                      <a
                        href="#"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Forgot your password?
                      </a>
                    </div>
                  )}
                </form>
                
                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                {/* Google Auth Button */}
                <GoogleAuthButton 
                  mode={isLogin ? 'signin' : 'signup'}
                  disabled={isLoading}
                  className="mb-4"
                />
              </div>
              
              {/* Mobile Navigation Safe Area */}
              <div className="h-4 lg:hidden mobile-safe-bottom" />
            </div>
          </div>
        </div>
      </div>
    
    </>
  );
}