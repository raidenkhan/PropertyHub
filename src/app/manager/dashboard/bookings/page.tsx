"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, User } from "lucide-react"

const bookings = [
  {
    id: 1,
    property: "3BR Apartment in Victoria Island",
    client: "John Doe",
    date: "2024-01-20",
    time: "10:00 AM",
    status: "confirmed",
    type: "viewing",
    agent: "Sarah Wilson",
  },
  {
    id: 2,
    property: "Office Space in Ikeja",
    client: "Mike Johnson",
    date: "2024-01-22",
    time: "2:00 PM",
    status: "pending",
    type: "inspection",
    agent: "Emma Davis",
  },
  {
    id: 3,
    property: "Land Plot in Abuja",
    client: "David Brown",
    date: "2024-01-18",
    time: "11:30 AM",
    status: "completed",
    type: "viewing",
    agent: "Lisa Chen",
  },
]

export default function BookingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bookings</h1>
            <p className="text-muted-foreground">Manage property viewings and inspections</p>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{booking.property}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {booking.client}
                        </div>
                        <div className="flex items-cenfter gap-1">
                          <Calendar className="h-3 w-3" />
                          {booking.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {booking.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.agent}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        booking.status === "confirmed"
                          ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                          : booking.status === "completed"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                            : "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400"
                      }
                    >
                      {booking.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
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
