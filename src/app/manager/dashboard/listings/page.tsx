"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Search, Eye, Check, X, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const listings = [
  {
    id: 1,
    title: "Modern 3BR Apartment in Victoria Island",
    location: "Victoria Island, Lagos",
    price: "₦2,500,000",
    type: "Apartment",
    status: "pending",
    owner: "John Doe",
    submittedDate: "2024-01-15",
    image: "/placeholder.svg?height=80&width=120",
  },
  {
    id: 2,
    title: "Prime Commercial Shop Space in Ikeja",
    location: "Ikeja, Lagos",
    price: "₦1,200,000",
    type: "Commercial",
    status: "approved",
    owner: "Sarah Wilson",
    submittedDate: "2024-01-10",
    image: "/placeholder.svg?height=80&width=120",
  },
  {
    id: 3,
    title: "Luxury 5BR Detached House in Lekki",
    location: "Lekki Phase 1, Lagos",
    price: "₦45,000,000",
    type: "House",
    status: "rejected",
    owner: "Mike Johnson",
    submittedDate: "2024-01-08",
    image: "/placeholder.svg?height=80&width=120",
  },
]

export default function ListingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Listings</h1>
            <p className="text-muted-foreground">Review and manage property listings</p>
          </div>
          <Button>
            <Building2 className="mr-2 h-4 w-4" />
            Add Listing
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 dark:bg-gray-900">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search listings..." className="pl-10" />
              </div>
              <Select>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 dark:bg-gray-800">
          {listings.map((listing) => (
            <Card key={listing.id} className="dark:bg-gray-900">
              <CardContent className="p-4">
                <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                  <img
                    src={listing.image || "/placeholder.svg"}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-foreground line-clamp-2">{listing.title}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm text-muted-foreground">{listing.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg text-foreground">{listing.price}</span>
                    <Badge
                      className={
                        listing.status === "approved"
                          ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                          : listing.status === "rejected"
                            ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                            : "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400"
                      }
                    >
                      {listing.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    By {listing.owner} • {listing.submittedDate}
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
