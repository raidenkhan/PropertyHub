"use client";
import { useState ,useEffect} from "react";
import { Search, Menu, X, Bell, User, Heart, LogOut, Home, MessageSquare, Plus, LayoutDashboard, AlertTriangle, Settings } from "lucide-react";
import Link from 'next/link';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth/authContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Badge } from "./ui/badge";
import { messagesService } from '@/lib/api/messageService';
import { chatService } from "@/lib/api/chatService";
import { NotificationBell } from "@/components/NotificationBell";


export function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [showPayoutAlert, setShowPayoutAlert] = useState(false);

  const [unreadCount,setUnreadCount]=useState(0)
 
  const savedProperties = 5;

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const handleNavClick = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };
    useEffect(() => {
    if (user && !user.paystackRecipientCode) {
      setShowPayoutAlert(true);
    }

    if (!user) return;

    const fetchUnreadCount = async () => {
        try {
            const count = await messagesService.getUnreadMessageCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    fetchUnreadCount();

    // Real-time update with WebSockets
    const socket = chatService.connect();
    if (socket) {
        const handleNewMessage = () => {
            // Refetch count when a new message comes in
            fetchUnreadCount();
        };
        socket.on('newMessage', handleNewMessage);

        return () => {
            socket.off('newMessage', handleNewMessage);
        };
    }
  }, [user]);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-background/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-border shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm sm:text-lg">P</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg sm:text-xl text-foreground">PropertyHub</h1>
                <p className="text-xs text-muted-foreground">Real Estate Marketplace</p>
              </div>
            </Link>
          </motion.div>

          {/* Search Bar - Desktop */}
          <motion.div
            className="hidden md:flex items-center gap-3 flex-1 max-w-xl mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search properties, locations..."
                className="pl-10 pr-4 py-2 bg-background border-input focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    router.push('/properties');
                  }
                }}
              />
            </div>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 shadow-md hover:shadow-lg transition-all duration-200"
              onClick={() => router.push('/properties')}
            >
              Search
            </Button>
          </motion.div>

          {/* Navigation - Desktop */}
          <motion.nav
            className="hidden lg:flex items-center gap-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {user ? (
              // Logged-in user navigation
              <>
                <button 
                  onClick={() => {
                    try {
                      const mode = typeof window !== 'undefined' ? window.localStorage.getItem('dashboardMode') : null;
                      const href = mode === 'hosting' ? '/host/dashboard' : '/dashboard';
                      router.push(href);
                    } catch {
                      router.push('/dashboard');
                    }
                  }}
                  className="text-muted-foreground hover:text-primary transition-colors font-medium flex flex-col md:flex-row items-center gap-1 md:gap-2"
                >
                  <div className="flex flex-col items-center gap-1  ">

                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                  </div>
                </button>
                <Link 
                  href="/properties" 
                  className="text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  Browse
                </Link>
                <Link 
                  href="/host/properties/new" 
                  className="text-muted-foreground hover:text-primary transition-colors font-medium flex flex-col md:flex-row items-center gap-1 md:gap-2"
                >
                  <div className="flex flex-col items-center gap-1  ">

                  
                  <span>+ List Property</span>
                  </div>
                </Link>
                <Link 
                  href="/messages" 
                  className="text-muted-foreground hover:text-primary transition-colors font-medium flex flex-col md:flex-row items-center gap-1 md:gap-2 relative"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              </>
            ) : (
              // Non-logged-in user navigation
              <>
                <Link 
                  href="/properties" 
                  className="text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  All Properties
                </Link>
                <Link 
                  href="/auth" 
                  className="text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  List Your Property
                </Link>
              </>
            )}
          </motion.nav>

          {/* Action Buttons */}
          <motion.div
            className="flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {user && (
              <>
                {/* Saved Properties */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex flex-col items-center gap-1 hover:bg-accent relative md:flex-row md:gap-2"
                  onClick={() => router.push('/saved')}
                >
                  <div className="flex flex-col items-center gap-1  ">
                    <Heart className="w-4 h-4" />
                    <span>Saved</span>
                  </div>
                 
                  {savedProperties > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {savedProperties}
                    </Badge>
                  )}
                </Button>

                {/* Notifications */}
                <div className="hidden sm:block">
                  <NotificationBell />
                </div>
              </>
            )}

            {showPayoutAlert && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden xl:flex flex-col items-center gap-1 hover:bg-accent relative text-yellow-500 md:flex-row md:gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Action Required</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem onClick={() => handleNavClick('/dashboard/settings')}>
                    <p className="text-sm font-medium">Please set up your payout details to receive payments for property sales.</p>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Profile Dropdown */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="cursor-pointer flex flex-col items-center gap-1 md:flex-row md:gap-2">
                    <User className="w-4 h-4" />
                    <span>{user.name?.split(' ')[0] || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleNavClick('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick('/my-listings')}>
                    
                    <Home className="mr-2 h-4 w-4" />
                    My Listings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick('/my-bookings')}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    My Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick('/dashboard/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button variant="secondary" size="sm" className="cursor-pointer flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}

            <ThemeToggle />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </motion.div>
        </div>

        {/* Mobile Search */}
        <motion.div
          className="md:hidden mt-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search properties..."
              className="pl-10 pr-4 py-2 bg-background border-input focus:border-ring"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  router.push('/properties');
                  setIsMenuOpen(false);
                }
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-background/98 backdrop-blur-md border-t border-border"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
              <nav className="flex flex-col gap-3">
                {user ? (
                  // Logged-in mobile menu
                  <>
                      <Button 
                        variant="ghost" 
                        className="justify-start text-left"
                        onClick={() => handleNavClick('/dashboard')}
                      >
                        <LayoutDashboard className="w-4 h-4 mr-3" />
                        Dashboard
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="justify-start text-left"
                        onClick={() => handleNavClick('/properties')}
                      >
                        <Search className="w-4 h-4 mr-3" />
                        All Properties
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="justify-start text-left"
                        onClick={() => handleNavClick('/host/properties/new')}
                      >
                        <Plus className="w-4 h-4 mr-3" />
                        List Property
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="justify-start text-left relative"
                        onClick={() => handleNavClick('/messages')}
                      >
                        <MessageSquare className="w-4 h-4 mr-3" />
                        Messages
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="justify-start text-left"
                        onClick={() => handleNavClick('/saved')}
                      >
                        
                        <Heart className="w-4 h-4 mr-3" />
                        Saved Properties
                        {savedProperties > 0 && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {savedProperties}
                          </Badge>
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="justify-start text-left"
                        onClick={() => handleNavClick('/notifications')}
                      >
                        <Bell className="w-4 h-4 mr-3" />
                        Alerts
                      </Button>
                    
                    <div className="border-t border-border pt-3 mt-3">
                      <Button 
                        variant="ghost" 
                        className="justify-start text-left"
                        onClick={() => handleNavClick('/profile')}
                      >
                        <User className="w-4 h-4 mr-3" />
                        My Profile
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="justify-start text-left"
                        onClick={() => handleNavClick('/my-listings')}
                      >
                        <Home className="w-4 h-4 mr-3" />
                        My Listings
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="justify-start text-left"
                        onClick={() => handleNavClick('/my-bookings')}
                      >
                        <MessageSquare className="w-4 h-4 mr-3" />
                        My Listings
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="justify-start text-left"
                        onClick={() => handleNavClick('/dashboard/settings')}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="justify-start text-left text-red-600 hover:text-red-600" 
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </Button>
                    </div>
                  </>
                ) : (
                  // Non-logged-in mobile menu
                  <>
                    <Button 
                      variant="ghost" 
                      className="justify-start text-left"
                      onClick={() => handleNavClick('/properties')}
                    >
                      <Search className="w-4 h-4 mr-3" />
                      All Properties
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start text-left"
                      onClick={() => handleNavClick('/auth')}
                    >
                      <Plus className="w-4 h-4 mr-3" />
                      List Your Property
                    </Button>
                    <div className="border-t border-border pt-3 mt-3">
                      <Button 
                        variant="ghost" 
                        className="justify-start text-left"
                        onClick={() => handleNavClick('/auth')}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Sign In / Sign Up
                      </Button>
                    </div>
                  </>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}