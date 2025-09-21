"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, User, Building2 } from "lucide-react"

const disputes = [
  {
    id: 1,
    title: "Property condition mismatch",
    description: "The property shown in photos doesn't match the actual condition",
    complainant: "John Doe",
    respondent: "Sarah Wilson",
    property: "3BR Apartment in Victoria Island",
    status: "open",
    priority: "high",
    createdDate: "2024-01-15",
    lastUpdate: "2 hours ago",
  },
  {
    id: 2,
    title: "Payment dispute",
    description: "Deposit was charged but booking was cancelled",
    complainant: "Mike Johnson",
    respondent: "Emma Davis",
    property: "Office Space in Ikeja",
    status: "investigating",
    priority: "medium",
    createdDate: "2024-01-12",
    lastUpdate: "1 day ago",
  },
  {
    id: 3,
    title: "Fraudulent listing",
    description: "Property doesn't exist at the listed address",
    complainant: "David Brown",
    respondent: "Lisa Chen",
    property: "Land Plot in Abuja",
    status: "resolved",
    priority: "high",
    createdDate: "2024-01-10",
    lastUpdate: "3 days ago",
  },
]

export default function DisputesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Disputes</h1>
            <p className="text-muted-foreground">Manage and resolve user disputes</p>
          </div>
        </div>

        {/* Disputes List */}
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id} className="dark:bg-gray-900">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{dispute.title}</h3>
                      <p className="text-sm text-muted-foreground">#{dispute.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        dispute.priority === "high"
                          ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                          : "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400"
                      }
                    >
                      {dispute.priority} priority
                    </Badge>
                    <Badge
                      className={
                        dispute.status === "resolved"
                          ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                          : dispute.status === "investigating"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                            : "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
                      }
                    >
                      {dispute.status}
                    </Badge>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">{dispute.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Complainant</p>
                      <p className="text-sm font-medium">{dispute.complainant}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Respondent</p>
                      <p className="text-sm font-medium">{dispute.respondent}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Property</p>
                      <p className="text-sm font-medium">{dispute.property}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Created: {dispute.createdDate}</span>
                    <span>•</span>
                    <span>Last update: {dispute.lastUpdate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {dispute.status !== "resolved" && <Button size="sm">Take Action</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
