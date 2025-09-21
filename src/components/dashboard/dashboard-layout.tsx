"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardNavbar } from "./dashboard-navbar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      {/* Sidebar */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className={cn("transition-all duration-300", "lg:ml-64")}>
        {/* Top Navigation */}
        <DashboardNavbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-gray-800 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
