"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/lib/auth/protectedRoute"
import { createProperty } from "@/lib/propertyService"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be positive"),
  location: z.string().min(1, "Location is required"),
  type: z.enum(["RENT", "SALE", "LEASE", "STAY"]),
  imageUrl: z.string().url().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function PostPropertyPage() {
  const searchParams = useSearchParams()
  const defaultType = searchParams.get("type") as FormData["type"] || "SALE"

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: defaultType,
    },
  })

  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setSubmitError(null)
    try {
      await createProperty(data)
      router.push("/")
    } catch (err) {
      setSubmitError("Failed to create property listing")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background dark:bg-gray-900">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">List Your Property</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" {...register("title")} />
                  {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register("description")} />
                  {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </div>

                <div>
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input id="price" type="number" {...register("price", { valueAsNumber: true })} />
                  {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" {...register("location")} />
                  {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
                </div>

                <div>
                  <Label htmlFor="type">Property Type</Label>
                  <Select defaultValue={defaultType} onValueChange={(value) => setValue("type", value as FormData["type"])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RENT">Rent</SelectItem>
                      <SelectItem value="SALE">Sale</SelectItem>
                      <SelectItem value="LEASE">Lease</SelectItem>
                      <SelectItem value="STAY">Stay</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
                </div>

                <div>
                  <Label htmlFor="imageUrl">Image URL (optional)</Label>
                  <Input id="imageUrl" {...register("imageUrl")} />
                  {errors.imageUrl && <p className="text-red-500 text-sm">{errors.imageUrl.message}</p>}
                </div>

                {submitError && <p className="text-red-500">{submitError}</p>}

                <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  {loading ? "Submitting..." : "Submit Listing"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}