"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Home, Building, Hotel, DollarSign } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/authContext"

interface PropertyTypeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'rent' | 'sell' | null
}

const typeOptions = {
  sell: [
    { value: "SALE", label: "Sell your property", description: "List your property for permanent sale", icon: DollarSign }
  ],
  rent: [
    { value: "RENT", label: "Long-term rent", description: "Rent out for months or years", icon: Home },
    { value: "LEASE", label: "Lease (commercial)", description: "Lease for business or long-term", icon: Building },
    { value: "STAY", label: "Short-term stay", description: "Host for nights or weeks like Airbnb", icon: Hotel }
  ]
}

export function PropertyTypeModal({ open, onOpenChange, mode }: PropertyTypeModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const options = mode ? typeOptions[mode] : []

  const handleContinue = () => {
    if (!selectedType) return

    const redirectPath = `/post-property?type=${selectedType}`
    if (!isAuthenticated) {
      router.push(`/auth?redirect=${encodeURIComponent(redirectPath)}`)
    } else {
      router.push(redirectPath)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">What kind of property do you want to list?</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {options.map((option) => (
            <Card
              key={option.value}
              className={`cursor-pointer transition-all hover:shadow-md ${selectedType === option.value ? 'border-primary shadow-lg' : ''}`}
              onClick={() => setSelectedType(option.value)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <option.icon className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold">{option.label}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button
          onClick={handleContinue}
          disabled={!selectedType}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  )
}