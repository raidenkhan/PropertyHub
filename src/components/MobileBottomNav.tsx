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
import { useResponsive } from "@/hooks/useResponsive";
import { messagesService } from '@/lib/api/messageService';
import { chatService } from "@/lib/api/chatService";
import { useWishlist } from '@/lib/hooks/useWishlist';

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
  const { isMobileOrTablet } = useResponsive();
  const { theme, setTheme } = useTheme();
  const { wishlistCount: savedProperties } = useWishlist();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
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
    // Don't close the menu if this is the "more" button toggle
    if (item.id !== 'more') {
      setShowMoreMenu(false);
    }
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

  // Main navigation items (always visible) - removed search since it's available on main screen
  const mainNavItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
      path: '/',
    },
    {
      id: 'map',
      label: 'Map',
      icon: <MapPin className="w-5 h-5" />,
      path: '/map',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/dashboard',
      requiresAuth: true,
      onClick: handleDashboardClick,
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


  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path) || false;
  };

  // Don't show on desktop or before hydration
  if (!isHydrated || !isMobileOrTablet) return null;

  return (
    <>
      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Enhanced Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
              onClick={() => setShowMoreMenu(false)}
            />
            
            {/* Enhanced More Menu */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9 }}
              transition={{ 
                duration: 0.4, 
                ease: "easeOut",
                type: "spring",
                damping: 25,
                stiffness: 300
              }}
              className="fixed bottom-24 left-4 right-4 max-w-md mx-auto bg-background/98 backdrop-blur-xl rounded-3xl border border-border/20 shadow-2xl z-50"
              style={{
                background: theme === 'dark' 
                  ? 'rgba(0, 0, 0, 0.95)' 
                  : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(30px) saturate(180%)',
                border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: theme === 'dark' 
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div className="p-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-foreground dark:text-white">Quick Access</h3>
                    <p className="text-sm text-muted-foreground mt-1">Navigate and manage your account</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMoreMenu(false)}
                    className="h-9 w-9 p-0 rounded-full hover:bg-accent/60 transition-all duration-200 hover:scale-105"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Organized Sections with improved UX */}
                <div className="space-y-6 max-h-[65vh] overflow-y-auto scrollbar-hide">
                  {user ? (
                    <>
                      {/* Enhanced Quick Actions Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1 h-4 bg-primary rounded-full"></div>
                          <p className="text-sm font-semibold text-foreground dark:text-white">Quick Actions</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, onClick: handleDashboardClick },
                            { id: 'add-property', label: 'List Property', icon: <Plus className="w-5 h-5" />, path: '/host/properties/new' },
                            { id: 'map', label: 'Map View', icon: <MapPin className="w-5 h-5" />, path: '/map' }
                          ].map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.1, delay: index * 0.05 }}
                            >
                              <Button
                                variant="ghost"
                                className="h-18 w-full flex flex-col items-center justify-center gap-2 rounded-2xl bg-accent/20 hover:bg-accent/60 hover:shadow-lg transition-all duration-300 group hover:scale-105 border border-border/10"
                                onClick={() => {
                                  if (item.onClick) {
                                    item.onClick();
                                  } else {
                                    router.push(item.path!);
                                  }
                                  setShowMoreMenu(false);
                                }}
                              >
                                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                                  {item.icon}
                                </div>
                                <span className="text-xs font-semibold text-center leading-tight text-foreground dark:text-white">{item.label}</span>
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Enhanced Account Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                          <p className="text-sm font-semibold text-foreground dark:text-white">Account</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
                            { id: 'wishlist', label: 'Wishlist', icon: <Heart className="w-5 h-5" />, path: '/wishlist', badge: savedProperties > 0 ? savedProperties : undefined },
                            { id: 'notifications', label: 'Alerts', icon: <Bell className="w-5 h-5" />, path: '/notifications' }
                          ].map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.1, delay: 0.1 + index * 0.05 }}
                            >
                              <Button
                                variant="ghost"
                                className="h-18 w-full flex flex-col items-center justify-center gap-2 rounded-2xl bg-accent/20 hover:bg-accent/60 hover:shadow-lg transition-all duration-300 group hover:scale-105 relative border border-border/10"
                                onClick={() => {
                                  router.push(item.path);
                                  setShowMoreMenu(false);
                                }}
                              >
                                <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all duration-300 group-hover:scale-110 relative">
                                  {item.icon}
                                  {(item as any).badge && (
                                    <Badge 
                                      variant="secondary" 
                                      className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground animate-pulse shadow-lg"
                                    >
                                      {typeof (item as any).badge === 'number' && (item as any).badge > 99 ? '99+' : (item as any).badge}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs font-semibold text-center leading-tight text-foreground dark:text-white">{item.label}</span>
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Enhanced Settings & Logout */}
                      <div className="border-t border-border/30 pt-6 mt-2">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                          <p className="text-sm font-semibold text-foreground dark:text-white">Settings</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.1, delay: 0.2 }}
                          >
                            <Button
                              variant="ghost"
                              className="h-18 w-full flex flex-col items-center justify-center gap-2 rounded-2xl bg-accent/20 hover:bg-accent/60 hover:shadow-lg transition-all duration-300 group hover:scale-105 border border-border/10"
                              onClick={() => {
                                router.push('/dashboard/settings');
                                setShowMoreMenu(false);
                              }}
                            >
                              <div className="p-3 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-all duration-300 group-hover:scale-110">
                                <Settings className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-semibold text-center leading-tight text-foreground dark:text-white">Settings</span>
                            </Button>
                          </motion.div>
                          
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.1, delay: 0.25 }}
                          >
                            <Button
                              variant="ghost"
                              className="h-18 w-full flex flex-col items-center justify-center gap-2 rounded-2xl bg-accent/20 hover:bg-accent/60 hover:shadow-lg transition-all duration-300 group hover:scale-105 border border-border/10"
                              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            >
                              <div className="p-3 rounded-xl bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-all duration-300 group-hover:scale-110">
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                              </div>
                              <span className="text-xs font-semibold text-center leading-tight text-foreground dark:text-white">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                            </Button>
                          </motion.div>
                          
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.1, delay: 0.3 }}
                          >
                            <Button
                              variant="ghost"
                              className="h-18 w-full flex flex-col items-center justify-center gap-2 rounded-2xl bg-red-50/50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-300 group hover:scale-105 border border-red-200/30 dark:border-red-800/30 hover:shadow-lg"
                              onClick={async () => {
                                await logout();
                                setShowMoreMenu(false);
                              }}
                            >
                              <div className="p-3 rounded-xl bg-red-100/50 dark:bg-red-900/30 group-hover:bg-red-200/70 dark:group-hover:bg-red-900/50 transition-all duration-300 group-hover:scale-110">
                                <LogOut className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-semibold text-center leading-tight">Logout</span>
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Non-authenticated user menu */
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'properties', label: 'Browse', icon: <Search className="w-5 h-5" />, path: '/properties' },
                        { id: 'map', label: 'Map View', icon: <MapPin className="w-5 h-5" />, path: '/map' },
                        { id: 'auth', label: 'Sign In', icon: <User className="w-5 h-5" />, path: '/auth' }
                      ].map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.1, delay: index * 0.05 }}
                        >
                          <Button
                            variant="ghost"
                            className="h-16 w-full flex flex-col items-center justify-center gap-2 rounded-2xl hover:bg-accent/50 hover:shadow-lg transition-all duration-200 group hover:scale-105"
                            onClick={() => router.push(item.path)}
                          >
                            <div className="p-2 rounded-xl group-hover:bg-primary/10 transition-all duration-200">
                              {item.icon}
                            </div>
                            <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                          </Button>
                        </motion.div>
                      ))}  
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.1, delay: 0.2 }}
                      >
                        <Button
                          variant="ghost"
                          className="h-16 w-full flex flex-col items-center justify-center gap-2 rounded-2xl hover:bg-accent/50 hover:shadow-lg transition-all duration-200 group hover:scale-105"
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                          <div className="p-2 rounded-xl group-hover:bg-primary/10 transition-all duration-200">
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                          </div>
                          <span className="text-xs font-medium text-center leading-tight">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                        </Button>
                      </motion.div>
                    </div>
                  )}
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
            ? 'rgba(0, 0, 0, 0.85)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderTop: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`
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
                      ? 'text-primary shadow-lg shadow-primary/20 bg-primary/10' 
                      : `${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} hover:bg-accent/60 hover:shadow-md`
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