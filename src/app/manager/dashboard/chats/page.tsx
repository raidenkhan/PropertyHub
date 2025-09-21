"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Search, Eye, Check, X } from "lucide-react"

const chats = [
  {
    id: 1,
    participants: ["John Doe", "Sarah Wilson"],
    lastMessage: "Is the property still available?",
    timestamp: "2 hours ago",
    status: "flagged",
    reason: "Inappropriate language",
    property: "3BR Apartment in VI",
  },
  {
    id: 2,
    participants: ["Mike Johnson", "Emma Davis"],
    lastMessage: "Can we schedule a viewing?",
    timestamp: "5 hours ago",
    status: "normal",
    reason: null,
    property: "Office Space in Ikeja",
  },
  {
    id: 3,
    participants: ["David Brown", "Lisa Chen"],
    lastMessage: "What about the price negotiation?",
    timestamp: "1 day ago",
    status: "flagged",
    reason: "Spam content detected",
    property: "Land in Abuja",
  },
]

export default function ChatsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Chats</h1>
            <p className="text-muted-foreground">Monitor and moderate user conversations</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="dark:bg-gray-900">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search chats..." className="pl-10" />
              </div>
              <Select>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chats</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Chats List */}
        <Card className="dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chats.map((chat) => (
                <div key={chat.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex -space-x-2">
                      {chat.participants.map((participant, index) => (
                        <Avatar key={index} className="border-2 border-background">
                          <AvatarImage src="/placeholder.svg?height=40&width=40" />
                          <AvatarFallback className="text-xs">
                            {participant
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{chat.participants.join(" & ")}</p>
                        <Badge
                          className={
                            chat.status === "flagged"
                              ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                              : "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                          }
                        >
                          {chat.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{chat.property}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                      </div>
                      {chat.reason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Reason: {chat.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    {chat.status === "flagged" && (
                      <>
                        <Button variant="outline" size="sm">
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button variant="outline" size="sm">
                          <X className="h-4 w-4 mr-2" />
                          Block
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
