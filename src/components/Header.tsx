"use client";
import { useState ,useEffect} from "react";
import { Search, Menu, X, Bell, User, Heart, LogOut, Home, MessageSquare, Plus, LayoutDashboard, AlertTriangle, Settings, ChevronDown, Filter } from "lucide-react";
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 bg-background/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-border shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {/* Main Header Row */}
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo - Compact on mobile */}
            <motion.div
              className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Link href="/" className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm sm:text-base">P</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-base sm:text-xl text-foreground leading-tight">PropertyHub</h1>
                  <p className="text-xs text-muted-foreground leading-none">Real Estate Marketplace</p>
                </div>
                {/* Mobile-only compact text */}
                <div className="block sm:hidden">
                  <h1 className="font-bold text-base text-foreground">PropertyHub</h1>
                </div>
              </Link>
            </motion.div>

            {/* Center Section - Adaptive */}
            <div className="flex-1 flex items-center justify-center px-2 sm:px-4">
              {/* Mobile Quick Actions */}
              <div className="flex md:hidden items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-accent"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                >
                  <Search className="w-4 h-4" />
                </Button>
                
                {user && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-accent relative"
                      onClick={() => router.push('/messages')}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        </div>
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-accent relative"
                      onClick={() => router.push('/saved')}
                    >
                      <Heart className="w-4 h-4" />
                      {savedProperties > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">{savedProperties > 9 ? '9+' : savedProperties}</span>
                        </div>
                      )}
                    </Button>
                  </>
                )}
              </div>

              {/* Desktop Search Bar */}
              <motion.div
                className="hidden md:flex items-center gap-3 w-full max-w-md lg:max-w-lg"
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
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 lg:px-6 shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={() => router.push('/properties')}
                >
                  Search
                </Button>
              </motion.div>
            </div>

            {/* Desktop Navigation - Compact */}
            <motion.nav
              className="hidden lg:flex items-center gap-4 xl:gap-6 flex-shrink-0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {user ? (
                <>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      try {
                        const mode = typeof window !== 'undefined' ? window.localStorage.getItem('dashboardMode') : null;
                        const href = mode === 'hosting' ? '/host/dashboard' : '/dashboard';
                        router.push(href);
                      } catch {
                        router.push('/dashboard');
                      }
                    }}
                    className="text-muted-foreground hover:text-primary transition-colors font-medium px-2 xl:px-3"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-1" />
                    Dashboard
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/properties')}
                    className="text-muted-foreground hover:text-primary transition-colors font-medium px-2 xl:px-3"
                  >
                    Browse
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/host/properties/new')}
                    className="text-muted-foreground hover:text-primary transition-colors font-medium px-2 xl:px-3"
                  >
                    + List
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/properties')}
                    className="text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    All Properties
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/auth')}
                    className="text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    List Property
                  </Button>
                </>
              )}
            </motion.nav>

            {/* Right Side Actions - Compact */}
            <motion.div
              className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Desktop-only actions */}
              {user && (
                <>
                  {/* Desktop Saved Properties */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex items-center gap-1 hover:bg-accent relative px-2 xl:px-3"
                    onClick={() => router.push('/saved')}
                  >
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">Saved</span>
                    {savedProperties > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs h-4 min-w-4 p-0 flex items-center justify-center">
                        {savedProperties}
                      </Badge>
                    )}
                  </Button>

                  {/* Desktop Messages */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex items-center gap-1 hover:bg-accent relative px-2 xl:px-3"
                    onClick={() => router.push('/messages')}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">Messages</span>
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-1 text-xs h-4 min-w-4 p-0 flex items-center justify-center">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>

                  {/* Desktop Notifications */}
                  <div className="hidden lg:block">
                    <NotificationBell />
                  </div>
                </>
              )}

              {/* Payout Alert */}
              {showPayoutAlert && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden xl:flex items-center gap-1 hover:bg-accent text-yellow-600 px-2"
                  onClick={() => handleNavClick('/dashboard/settings')}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Setup</span>
                </Button>
              )}

              {/* User Profile */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 gap-1 sm:gap-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm hidden sm:inline">{user.name?.split(' ')[0] || 'User'}</span>
                      <ChevronDown className="w-3 h-3 opacity-50" />
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
                <Button
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 sm:px-3 gap-1"
                  onClick={() => router.push('/auth')}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">Sign In</span>
                </Button>
              )}

              {/* Theme Toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-8 w-8 p-0"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </motion.div>
          </div>
        </div>

          {/* Mobile Search Overlay */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden bg-background/98 backdrop-blur-md border-t border-border"
              >
                <div className="px-3 py-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search properties, locations..."
                      className="pl-10 pr-12 py-3 bg-background border-input focus:border-ring focus:ring-2 focus:ring-ring/20 text-base"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          router.push('/properties');
                          setIsSearchOpen(false);
                        }
                        if (e.key === 'Escape') {
                          setIsSearchOpen(false);
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setIsSearchOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Quick Search Actions */}
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => {
                        router.push('/properties');
                        setIsSearchOpen(false);
                      }}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search All
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="px-3"
                      onClick={() => {
                        router.push('/properties?filters=true');
                        setIsSearchOpen(false);
                      }}
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        {/* Modern Mobile Sliding Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden bg-background/98 backdrop-blur-md border-t border-border shadow-lg"
            >
              <div className="px-3 py-4 max-h-[70vh] overflow-y-auto">
                {user ? (
                  <div className="space-y-1">
                    {/* Quick Actions Section */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">Quick Actions</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="ghost" 
                          className="h-12 flex flex-col items-center justify-center gap-1 text-xs"
                          onClick={() => handleNavClick('/dashboard')}
                        >
                          <LayoutDashboard className="w-5 h-5" />
                          Dashboard
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="h-12 flex flex-col items-center justify-center gap-1 text-xs"
                          onClick={() => handleNavClick('/host/properties/new')}
                        >
                          <Plus className="w-5 h-5" />
                          List Property
                        </Button>
                      </div>
                    </div>

                    {/* Navigation Section */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">Browse</p>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-12 px-3"
                        onClick={() => handleNavClick('/properties')}
                      >
                        <Search className="w-4 h-4 mr-3" />
                        <span className="flex-1 text-left">All Properties</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-12 px-3 relative"
                        onClick={() => handleNavClick('/messages')}
                      >
                        <MessageSquare className="w-4 h-4 mr-3" />
                        <span className="flex-1 text-left">Messages</span>
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs h-5 min-w-5 px-1.5">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-12 px-3 relative"
                        onClick={() => handleNavClick('/saved')}
                      >
                        <Heart className="w-4 h-4 mr-3" />
                        <span className="flex-1 text-left">Saved Properties</span>
                        {savedProperties > 0 && (
                          <Badge variant="secondary" className="text-xs h-5 min-w-5 px-1.5">
                            {savedProperties > 99 ? '99+' : savedProperties}
                          </Badge>
                        )}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-12 px-3"
                        onClick={() => handleNavClick('/notifications')}
                      >
                        <Bell className="w-4 h-4 mr-3" />
                        <span className="flex-1 text-left">Notifications</span>
                      </Button>
                    </div>

                    {/* Account Section */}
                    <div className="border-t border-border pt-4 mt-4 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">Account</p>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-12 px-3"
                        onClick={() => handleNavClick('/profile')}
                      >
                        <User className="w-4 h-4 mr-3" />
                        <span className="flex-1 text-left">My Profile</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-12 px-3"
                        onClick={() => handleNavClick('/my-listings')}
                      >
                        <Home className="w-4 h-4 mr-3" />
                        <span className="flex-1 text-left">My Properties</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-12 px-3"
                        onClick={() => handleNavClick('/my-bookings')}
                      >
                        <MessageSquare className="w-4 h-4 mr-3" />
                        <span className="flex-1 text-left">My Bookings</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-12 px-3"
                        onClick={() => handleNavClick('/dashboard/settings')}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        <span className="flex-1 text-left">Settings</span>
                      </Button>
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-border pt-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          className="flex-1 justify-start h-12 px-3 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          <span className="flex-1 text-left">Logout</span>
                        </Button>
                        <div className="px-1">
                          <ThemeToggle />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Non-logged-in mobile menu
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-12 px-3"
                      onClick={() => handleNavClick('/properties')}
                    >
                      <Search className="w-4 h-4 mr-3" />
                      <span className="flex-1 text-left">All Properties</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-12 px-3"
                      onClick={() => handleNavClick('/auth')}
                    >
                      <Plus className="w-4 h-4 mr-3" />
                      <span className="flex-1 text-left">List Your Property</span>
                    </Button>
                    
                    <div className="border-t border-border pt-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 justify-start h-12 px-3"
                          onClick={() => handleNavClick('/auth')}
                        >
                          <User className="w-4 h-4 mr-3" />
                          <span className="flex-1 text-left">Sign In / Sign Up</span>
                        </Button>
                        <div className="px-1">
                          <ThemeToggle />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
