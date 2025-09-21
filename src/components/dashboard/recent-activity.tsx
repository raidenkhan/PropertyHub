"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Building2, MessageSquare, AlertTriangle, UserCheck, Clock } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "listing",
    title: "New listing submitted",
    description: "3BR Apartment in Victoria Island",
    user: "John Doe",
    time: "2 minutes ago",
    status: "pending",
    icon: Building2,
  },
  {
    id: 2,
    type: "chat",
    title: "Chat flagged for review",
    description: "Inappropriate language detected",
    user: "Sarah Wilson",
    time: "15 minutes ago",
    status: "flagged",
    icon: MessageSquare,
  },
  {
    id: 3,
    type: "dispute",
    title: "New dispute opened",
    description: "Property condition mismatch",
    user: "Mike Johnson",
    time: "1 hour ago",
    status: "urgent",
    icon: AlertTriangle,
  },
  {
    id: 4,
    type: "user",
    title: "User account verified",
    description: "KYC documents approved",
    user: "Emma Davis",
    time: "2 hours ago",
    status: "completed",
    icon: UserCheck,
  },
  {
    id: 5,
    type: "listing",
    title: "Listing approved",
    description: "Office space in Ikeja",
    user: "David Brown",
    time: "3 hours ago",
    status: "completed",
    icon: Building2,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400"
    case "flagged":
      return "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
    case "urgent":
      return "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
    case "completed":
      return "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
    default:
      return "bg-gray-50 text-gray-700 dark:bg-gray-950/20 dark:text-gray-400"
  }
}

export function RecentActivity() {
  return (
    <Card className="dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-muted">
                  <activity.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                    <Badge className={`text-xs ${getStatusColor(activity.status)}`}>{activity.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src="/placeholder.svg?height=20&width=20" />
                      <AvatarFallback className="text-xs">
                        {activity.user
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {activity.user} • {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
