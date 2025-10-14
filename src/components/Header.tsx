"use client";
import { useState ,useEffect} from "react";
import { Search, Bell, User, Heart, LogOut, Home, MessageSquare, Plus, LayoutDashboard, AlertTriangle, Settings, ChevronDown, DollarSign } from "lucide-react";
import Link from 'next/link';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion } from "framer-motion";
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
import { useWishlist } from '@/lib/hooks/useWishlist';
import { ProfileModal } from './ProfileModal';


export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showPayoutAlert, setShowPayoutAlert] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [unreadCount,setUnreadCount]=useState(0)
  const { wishlistCount: savedProperties } = useWishlist();

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
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {/* Main Header Row */}
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Enhanced Logo - Better mobile visibility */}
            <motion.div
              className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Link href="/" className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-base sm:text-lg">P</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-base sm:text-xl text-foreground leading-tight">PropertyHub</h1>
                  <p className="text-xs text-muted-foreground leading-none">Real Estate Marketplace</p>
                </div>
                {/* Enhanced Mobile branding */}
                <div className="block sm:hidden">
                  <h1 className="font-bold text-lg text-foreground tracking-tight">PropertyHub</h1>
                  <p className="text-xs text-muted-foreground leading-none -mt-1">Real Estate</p>
                </div>
              </Link>
            </motion.div>

            {/* Center Section - Desktop Search Only */}
            <div className="flex-1 flex items-center justify-center px-2 sm:px-4">
              {/* Desktop Search Bar Only */}
              <motion.div
                className="hidden md:flex items-center gap-3 w-full max-w-md lg:max-w-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={user ? `Find apartments, offices, or land in Nigeria` : "Search properties, locations..."}
                    className="pl-10 pr-4 py-2 bg-background border-input focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-200 rounded-xl"
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
                    onClick={() => router.push('/wishlist')}
                  >
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">Wishlist</span>
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

                  {/* Desktop Offers */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex items-center gap-1 hover:bg-accent relative px-2 xl:px-3"
                    onClick={() => router.push('/offers')}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Offers</span>
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
                  onClick={() => router.push('/dashboard/settings')}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Setup</span>
                </Button>
              )}

              {/* Enhanced User Profile */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 px-2 sm:px-3 gap-1 sm:gap-2 min-w-0">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground font-semibold text-xs">
                          {(user.name?.charAt(0) || 'U').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col items-start min-w-0 hidden xs:flex">
                        <span className="text-sm font-medium truncate max-w-20 sm:max-w-none">
                          {user.name?.split(' ')[0] || 'User'}
                        </span>
                        {user.roles?.length > 0 && (
                          <span className="text-xs text-muted-foreground capitalize leading-none">
                            {user.roles[0].toLowerCase()}
                          </span>
                        )}
                      </div>
                      <ChevronDown className="w-3 h-3 opacity-50 hidden sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="outline" 
                  size="sm" 
                  className="h-9 px-3 sm:px-4 gap-2 bg-secondary hover:bg-accent border-border transition-all duration-200"
                  onClick={() => router.push('/auth')}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign In</span>
                </Button>
              )}

              {/* Theme Toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

            </motion.div>
          </div>
        </div>

      </motion.header>
      
      {/* Personalized Welcome Banner */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-r from-accent/50 to-secondary/50 backdrop-blur-sm border-b border-border/50"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Home className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Welcome back, {user.name?.split(' ')[0] || 'there'}! 👋
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Discover your next property or manage your listings
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 text-xs hover:bg-primary/10"
                  onClick={() => router.push('/host/properties/new')}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  List Property
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 text-xs hover:bg-primary/10"
                  onClick={() => router.push('/wishlist')}
                >
                  <Heart className="w-3 h-3 mr-1" />
                  Saved ({savedProperties})
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </>
  );
}
