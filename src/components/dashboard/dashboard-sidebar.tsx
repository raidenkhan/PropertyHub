"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Users, Building2, MessageSquare, Calendar, AlertTriangle, BarChart3, Home, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface DashboardSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: "Dashboard", href: "/dashboard/users", icon: Home },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Listings", href: "/dashboard/listings", icon: Building2 },
  { name: "Chats", href: "/dashboard/chats", icon: MessageSquare },
  { name: "Bookings", href: "/dashboard/bookings", icon: Calendar },
  { name: "Disputes", href: "/dashboard/disputes", icon: AlertTriangle },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
]

export  function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col dark:bg-gray-800">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto dark:bg-gray-800 border-r border-border px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-lg text-foreground">PropertyHub</span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted",
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 z-50 flex w-64 flex-col transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r border-border px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-lg text-foreground">PropertyHub</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted",
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}
