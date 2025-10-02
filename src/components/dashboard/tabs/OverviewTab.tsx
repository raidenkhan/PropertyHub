"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock } from "lucide-react"

const activities = [
  { type: "purchase", title: "Purchase Confirmed", message: "₦49,394,304 for Hotel Delala", time: "2 hours ago", status: "success" },
  { type: "message", title: "New Message", message: "From Draylock Ray: Hi, I'm interested...", time: "1 day ago", status: "info" },
  { type: "property", title: "Property Sold", message: "Commercial Space in VI has been sold", time: "3 days ago", status: "success" },
]

export function OverviewTab() {
  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold">Recent Activity</h2>
      <div className="space-y-3 md:space-y-4">
        {activities.map((activity, index) => (
          <Card key={index} className="border-l-4 border-l-primary dark:border-l-blue-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm md:text-base">{activity.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
                <Badge className={
                  activity.status === "success" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                }>
                  {activity.status === "success" ? <CheckCircle className="h-3 w-3 md:h-4 md:w-4" /> : <Clock className="h-3 w-3 md:h-4 md:w-4" />}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}