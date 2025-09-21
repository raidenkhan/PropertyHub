"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MessageSquareWarning, AlertTriangle, UserX, TrendingUp, TrendingDown, Clock } from "lucide-react"

const stats = [
  {
    title: "Pending Listings",
    value: "24",
    change: "+12%",
    changeType: "increase" as const,
    icon: Building2,
    description: "Awaiting approval",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    title: "Flagged Chats",
    value: "8",
    change: "-5%",
    changeType: "decrease" as const,
    icon: MessageSquareWarning,
    description: "Require moderation",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    title: "Active Disputes",
    value: "3",
    change: "+2",
    changeType: "increase" as const,
    icon: AlertTriangle,
    description: "Need resolution",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
  {
    title: "Suspended Users",
    value: "12",
    change: "0%",
    changeType: "neutral" as const,
    icon: UserX,
    description: "Currently banned",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
  },
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 dark:bg-gray-800">
      {stats.map((stat) => (
        <Card key={stat.title} className="relative overflow-hidden dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </div>
              <div className="flex items-center gap-1">
                {stat.changeType === "increase" && <TrendingUp className="h-3 w-3 text-green-600" />}
                {stat.changeType === "decrease" && <TrendingDown className="h-3 w-3 text-red-600" />}
                {stat.changeType === "neutral" && <Clock className="h-3 w-3 text-gray-600" />}
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    stat.changeType === "increase"
                      ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/20"
                      : stat.changeType === "decrease"
                        ? "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/20"
                        : "text-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-950/20"
                  }`}
                >
                  {stat.change}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
