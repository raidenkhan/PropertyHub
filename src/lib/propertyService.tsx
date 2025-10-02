import { AuthenticatedFetch } from "@/lib/auth/authHook"
import { BACKEND_BASE_URL } from "@/lib/constants/api"

interface PropertyData {
  title: string
  description: string
  price: number
  location: string
  type: "LAND" | "APPARTMENT" | "OFFICE" | "COMMERCIAL";
  imageUrl?: string
}

export async function createProperty(data: PropertyData): Promise<void> {
  const { authenticatedFetch } = AuthenticatedFetch()
  
  try {
    const response = await authenticatedFetch(`${BACKEND_BASE_URL}/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to create property listing")
    }
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "An error occurred while submitting")
  }
}