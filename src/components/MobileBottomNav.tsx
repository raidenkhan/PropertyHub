"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Search, 
  Heart, 
  MessageSquare, 
  User,
  Plus,
  LayoutDashboard,
  Bell,
  Menu,
  X,
  Settings,
  LogOut,
  MapPin,
  AlertTriangle,
  Bookmark,
  Moon,
  Sun,
  Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth/authContext";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useResponsive } from "@/hooks/useResponsive";
import { messagesService } from '@/lib/api/messageService';
import { chatService } from "@/lib/api/chatService";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  requiresAuth?: boolean;
  badge?: number | string;
  onClick?: () => void;
}

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const { isMobileOrTablet } = useResponsive();
  const { theme, setTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch unread messages count
  useEffect(() => {
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
        fetchUnreadCount();
      };
      socket.on('newMessage', handleNewMessage);

      return () => {
        socket.off('newMessage', handleNewMessage);
      };
    }
  }, [user]);

  const handleNavClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick();
    } else {
      router.push(item.path);
    }
    setShowMoreMenu(false);
  };

  const handleDashboardClick = () => {
    try {
      if (typeof window !== 'undefined') {
        const mode = localStorage.getItem('dashboardMode');
        const href = mode === 'hosting' ? '/host/dashboard' : '/dashboard';
        router.push(href);
      } else {
        router.push('/dashboard');
      }
    } catch {
      router.push('/dashboard');
    }
  };

  // Main navigation items (always visible)
  const mainNavItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
      path: '/',
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="w-5 h-5" />,
      path: '#',
      onClick: () => setShowSearchOverlay(true),
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      icon: <Heart className="w-5 h-5" />,
      path: '/wishlist',
      requiresAuth: true,
      badge: wishlistCount > 0 ? wishlistCount : undefined,
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageSquare className="w-5 h-5" />,
      path: '/messages',
      requiresAuth: true,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'more',
      label: 'More',
      icon: showMoreMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />,
      path: '#',
      onClick: () => setShowMoreMenu(!showMoreMenu),
    },
  ];

  // Additional navigation items (shown in more menu)
  const moreNavItems: NavItem[] = user ? [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/dashboard',
      onClick: handleDashboardClick,
    },
    {
      id: 'add-property',
      label: 'List Property',
      icon: <Plus className="w-5 h-5" />,
      path: '/host/properties/new',
    },
    {
      id: 'map',
      label: 'Map View',
      icon: <MapPin className="w-5 h-5" />,
      path: '/map',
    },
    {
      id: 'my-listings',
      label: 'My Listings',
      icon: <Home className="w-5 h-5" />,
      path: '/my-listings',
    },
    {
      id: 'my-bookings',
      label: 'My Bookings',
      icon: <Bookmark className="w-5 h-5" />,
      path: '/my-bookings',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      path: '/notifications',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
      path: '/profile',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      path: '/dashboard/settings',
    },
    {
      id: 'theme-toggle',
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      icon: theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />,
      path: '#',
      onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: <LogOut className="w-5 h-5" />,
      path: '#',
      onClick: async () => {
        await logout();
        setShowMoreMenu(false);
      },
    },
  ] : [
    {
      id: 'properties',
      label: 'Browse Properties',
      icon: <Search className="w-5 h-5" />,
      path: '/properties',
    },
    {
      id: 'map',
      label: 'Map View',
      icon: <MapPin className="w-5 h-5" />,
      path: '/map',
    },
    {
      id: 'theme-toggle',
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      icon: theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />,
      path: '#',
      onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
    {
      id: 'auth',
      label: 'Sign In',
      icon: <User className="w-5 h-5" />,
      path: '/auth',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path) || false;
  };

  // Don't show on desktop or before hydration
  if (!isHydrated || !isMobileOrTablet) return null;

  return (
    <>
      {/* Search Overlay */}
      <AnimatePresence>
        {showSearchOverlay && (
          <>
            {/* Search Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
              onClick={() => setShowSearchOverlay(false)}
            />
            
            {/* Search Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-background/95 backdrop-blur-md rounded-3xl border border-border shadow-2xl z-50"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Search Properties</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSearchOverlay(false)}
                    className="h-8 w-8 p-0 rounded-full hover:bg-accent"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search properties, locations..."
                    className="pl-10 pr-4 py-3 bg-background/50 border-input focus:border-ring focus:ring-2 focus:ring-ring/20 text-base rounded-xl"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const query = (e.target as HTMLInputElement).value;
                        router.push(`/properties${query ? `?search=${encodeURIComponent(query)}` : ''}`);
                        setShowSearchOverlay(false);
                      }
                      if (e.key === 'Escape') {
                        setShowSearchOverlay(false);
                      }
                    }}
                  />
                </div>
                
                {/* Quick Search Actions */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-primary hover:bg-primary/90 rounded-xl"
                    onClick={() => {
                      router.push('/properties');
                      setShowSearchOverlay(false);
                    }}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Browse All
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="px-4 rounded-xl"
                    onClick={() => {
                      router.push('/map');
                      setShowSearchOverlay(false);
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setShowMoreMenu(false)}
            />
            
            {/* More Menu */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed bottom-20 left-4 right-4 bg-background/95 backdrop-blur-md rounded-3xl border border-border shadow-2xl z-50"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">More Options</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMoreMenu(false)}
                    className="h-8 w-8 p-0 rounded-full hover:bg-accent"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Grid Layout */}
                <div className="grid grid-cols-3 gap-4">
                  {moreNavItems.map((item, index) => {
                    const canAccess = !item.requiresAuth || user;
                    
                    if (!canAccess) return null;
                    
                    const isLogout = item.id === 'logout';

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          duration: 0.1, 
                          delay: index * 0.02,
                          ease: "easeOut"
                        }}
                      >
                        <Button
                          variant="ghost"
                          className={`h-16 w-full flex flex-col items-center justify-center gap-2 rounded-2xl transition-all duration-200 group hover:scale-105 ${
                            isLogout 
                              ? 'hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400' 
                              : 'hover:bg-accent/50 hover:shadow-lg'
                          }`}
                          onClick={() => handleNavClick(item)}
                        >
                          <div className={`relative p-2 rounded-xl transition-all duration-200 ${
                            isLogout 
                              ? 'group-hover:bg-red-100 dark:group-hover:bg-red-900/20' 
                              : 'group-hover:bg-primary/10'
                          }`}>
                            {item.icon}
                            {item.badge && (
                              <Badge 
                                variant="destructive" 
                                className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-xs animate-pulse"
                              >
                                {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t border-border/30 z-30 lg:hidden mobile-bottom-nav shadow-2xl"
        style={{
          background: theme === 'dark' 
            ? 'rgba(0, 0, 0, 0.3)' 
            : 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderTop: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
        }}
      >
        
        <div className="flex items-center justify-around px-3 py-3 safe-area-pb">
          {mainNavItems.map((item, index) => {
            const canAccess = !item.requiresAuth || user;
            
            if (!canAccess && item.requiresAuth) {
              // Replace auth-required items with sign-in for non-logged-in users
              if (item.id === 'wishlist' || item.id === 'messages') {
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15, delay: index * 0.03 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl gap-1 opacity-50 hover:opacity-70 transition-all duration-200"
                      onClick={() => router.push('/auth')}
                    >
                      <div className="p-2">
                        {item.icon}
                      </div>
                      <span className="text-xs font-medium">{item.label}</span>
                    </Button>
                  </motion.div>
                );
              }
              return null;
            }

            const active = isActive(item.path);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 0.15, 
                  delay: index * 0.03,
                  ease: "easeOut"
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={`relative flex flex-col items-center justify-center h-14 w-14 rounded-2xl gap-1 transition-all duration-300 group ${
                    active 
                      ? 'text-primary shadow-lg shadow-primary/20' 
                      : 'text-muted-foreground hover:text-foreground hover:shadow-md'
                  }`}
                  onClick={() => handleNavClick(item)}
                >
                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-2xl"
                      initial={false}
                      transition={{
                        type: "spring",
                        bounce: 0.1,
                        duration: 0.3
                      }}
                    />
                  )}
                  
                  {/* Icon container with hover effects */}
                  <div className={`relative p-2 rounded-xl transition-all duration-200 ${
                    active 
                      ? 'bg-primary/20' 
                      : 'group-hover:bg-accent/50 group-hover:scale-110'
                  }`}>
                    {item.icon}
                    {item.badge && (
                      <Badge 
                        variant={item.id === 'messages' ? 'destructive' : 'secondary'} 
                        className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-xs animate-pulse shadow-lg"
                      >
                        {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Label with enhanced styling */}
                  <span className={`text-xs font-medium transition-all duration-200 ${
                    active ? 'text-primary font-semibold' : 'group-hover:text-foreground'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Active dot indicator */}
                  {active && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    />
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Safe area bottom padding for devices with home indicator */}
        <div className="h-safe-bottom" />
      </motion.nav>
    </>
  );
}