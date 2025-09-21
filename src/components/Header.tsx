"use client";
import { useState } from "react";
import { Search, Menu, X, Bell, User, Heart, LogOut } from "lucide-react";
import Link from 'next/link';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PropertyTypeModal } from "@/components/PropertyTypeModal";
import { useAuth } from "@/lib/auth/authContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export function Header() {
  const router=useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'rent' | 'sell' | null>(null);
  const { user, logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    // Redirect handled by logout function
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 dark:bg-gray-800 backdrop-blur-md border-border shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">PropertyHub</h1>
              <p className="text-xs text-muted-foreground">Real Estate Marketplace</p>
            </div>
          </motion.div>

          {/* Search Bar - Desktop */}
          <motion.div
            className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search properties, locations..."
                className="pl-10 pr-4 py-2 bg-background border-input focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-200"
              />
            </div>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 shadow-md hover:shadow-lg transition-all duration-200"
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
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Buy
            </a>
            <button onClick={() => { setModalMode('rent'); setModalOpen(true);
              router.push('host/properties/new')
             }} className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Rent out
            </button>
            <button onClick={() => { setModalMode('sell'); setModalOpen(true); }} className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Sell
            </button>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Commercial
            </a>
          </motion.nav>

          {/* Action Buttons */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 hover:bg-accent">
              <Heart className="w-4 h-4" />
              <span className="hidden md:inline">Saved</span>
            </Button>
            <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 hover:bg-accent">
              <Bell className="w-4 h-4" />
              <span className="hidden md:inline">Alerts</span>
            </Button>

            {/* User Profile Dropdown */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="cursor-pointer hidden sm:flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline">{user.name?.split(' ')[0] || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-listings">My Listings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-bookings">My Bookings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button variant="secondary" size="sm" className="cursor-pointer hidden sm:flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">Login</span>
                </Button>
              </Link>
            )}

            <ThemeToggle />

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
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
            <div className="max-w-7xl mx-auto px-6 py-4">
              <nav className="flex flex-col gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium py-2">
                  Buy Properties
                </a>
                <button onClick={() => { setModalMode('rent'); setModalOpen(true); setIsMenuOpen(false); }} className="text-muted-foreground hover:text-primary transition-colors font-medium py-2 text-left">
                  Rent out Properties
                </button>
                <button onClick={() => { setModalMode('sell'); setModalOpen(true); setIsMenuOpen(false); }} className="text-muted-foreground hover:text-primary transition-colors font-medium py-2 text-left">
                  Sell Property
                </button>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium py-2">
                  Commercial
                </a>
                <div className="border-t border-border pt-4 mt-2">
                  <div className="flex flex-col gap-3">
                    <Button variant="ghost" className="justify-start">
                      <Heart className="w-4 h-4 mr-2" />
                      Saved Properties
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      <Bell className="w-4 h-4 mr-2" />
                      Property Alerts
                    </Button>
                    {user ? (
                      <>
                        <Button variant="ghost" className="justify-start" asChild>
                          <Link href="/profile">My Profile</Link>
                        </Button>
                        <Button variant="ghost" className="justify-start text-red-600" onClick={handleLogout}>
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link href="/auth">Login / Sign Up</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PropertyTypeModal open={modalOpen} onOpenChange={setModalOpen} mode={modalMode} />
    </motion.header>
  );
}