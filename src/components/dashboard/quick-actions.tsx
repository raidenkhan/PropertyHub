"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, UserPlus, FileText, Settings, Download, Mail } from "lucide-react"

const actions = [
  {
    title: "Add New Listing",
    description: "Create a new property listing",
    icon: Plus,
    color:
      "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/30",
  },
  {
    title: "Invite User",
    description: "Send invitation to new user",
    icon: UserPlus,
    color:
      "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-400 dark:hover:bg-green-950/30",
  },
  {
    title: "Generate Report",
    description: "Create monthly analytics report",
    icon: FileText,
    color:
      "bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:hover:bg-purple-950/30",
  },
  {
    title: "System Settings",
    description: "Configure platform settings",
    icon: Settings,
    color:
      "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-950/20 dark:text-gray-400 dark:hover:bg-gray-950/30",
  },
  {
    title: "Export Data",
    description: "Download user and listing data",
    icon: Download,
    color:
      "bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:hover:bg-orange-950/30",
  },
  {
    title: "Send Notification",
    description: "Broadcast message to users",
    icon: Mail,
    color:
      "bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:hover:bg-teal-950/30",
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => (
            <Button key={action.title} variant="ghost" className="h-auto p-4 justify-start text-left hover:bg-muted/50">
              <div className="flex items-center gap-3 w-full">
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
