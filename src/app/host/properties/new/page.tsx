// app/host/properties/new/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, MapPin, DollarSign, Home, Clock, Star, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";
import { toast } from "@/hooks/use-toast";
import { propertyService } from '@/lib/api/propertyService';
import { AnimatedBackground } from "@/components/animated-background";

// Types
interface PropertyFormData {
  title: string;
  description: string;
  type: "SELL" | "RENT" | "LEASE" | "STAY";
  price: string;
  location: string;
  coordinates: { lat: number; lng: number } | null;
  bedrooms: string;
  bathrooms: string;
  area: string;
  amenities: string[];
  images: File[];
}

// Mock amenities — replace with real data or dynamic selection
const AMENITIES = [
  "Air Conditioning",
  "Swimming Pool",
  "Gym",
  "Parking",
  "Security",
  "Furnished",
  "Pet Friendly",
  "Balcony",
  "Garden",
  "Wifi",
  "Laundry",
  "Elevator",
];

export default function NewPropertyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    type: "RENT",
    price: "",
    location: "",
    coordinates: null,
    bedrooms: "",
    bathrooms: "",
    area: "",
    amenities: [],
    images: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 6.5244, // Lagos default
    lng: 3.3792,
  });

  // Initialize map with user's location if available (future enhancement)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Fallback to Lagos if geolocation fails
        }
      );
    }
  }, []);

  const handleInputChange = (field: string, value: string | File[] | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + formData.images.length > 10) {
        toast({
          title: "❌ Too many images",
          description: "You can upload a maximum of 10 images.",
        });
        return;
      }
      handleInputChange("images", [...formData.images, ...files]);

      // Generate preview URLs
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviewImages((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    handleInputChange("images", newImages);
    setPreviewImages(newPreviews);
  };

  const toggleAmenity = (amenity: string) => {
    if (formData.amenities.includes(amenity)) {
      handleInputChange(
        "amenities",
        formData.amenities.filter((a) => a !== amenity)
      );
    } else {
      handleInputChange("amenities", [...formData.amenities, amenity]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (!formData.price) {
      newErrors.price = "Price is required";
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (!formData.coordinates) {
      //newErrors.location = "Please select location on map"; wait
      formData.coordinates = mapCenter; // Default to center if not set
    }

    if (!formData.bedrooms) {
      newErrors.bedrooms = "Number of bedrooms is required";
    } else if (isNaN(Number(formData.bedrooms)) || Number(formData.bedrooms) < 0) {
      newErrors.bedrooms = "Bedrooms must be a valid number";
    }

    if (!formData.bathrooms) {
      newErrors.bathrooms = "Number of bathrooms is required";
    } else if (isNaN(Number(formData.bathrooms)) || Number(formData.bathrooms) < 0) {
      newErrors.bathrooms = "Bathrooms must be a valid number";
    }

    if (!formData.area) {
      newErrors.area = "Area is required";
    } else if (isNaN(Number(formData.area)) || Number(formData.area) <= 0) {
      newErrors.area = "Area must be a positive number";
    }

    if (formData.images.length === 0) {
      newErrors.images = "At least one image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;

  setIsSubmitting(true);

  try {
    // Prepare FormData
    const formDataToSend = new FormData();

    // Append files
    formData.images.forEach(file => {
      formDataToSend.append('images', file);
    });

    // Append property data as JSON string
    formDataToSend.append('propertyData', JSON.stringify({
      title: formData.title,
      description: formData.description,
      type: formData.type,
      price: parseFloat(formData.price),
      location: formData.location,
      coordinates: formData.coordinates || mapCenter,
      bedrooms: parseInt(formData.bedrooms),
      bathrooms: parseInt(formData.bathrooms),
      area: parseFloat(formData.area),
      amenities: formData.amenities,
    }));

    // ✅ Use new method for FormData
    const result = await propertyService.createPropertyWithFiles(formDataToSend);

    toast({
      title: "✅ Property Submitted!",
      description: "Your property is under review. You'll be notified once approved.",
    });

    // Redirect to Host Dashboard
    router.push("/host/dashboard");
  } catch (error: any) {
    toast({
      title: "❌ Submission Failed",
      description: error.message || "An error occurred. Please try again.",
    });
  } finally {
    setIsSubmitting(false);
  }
};
  const getTypeColor = (type: PropertyFormData["type"]) => {
    switch (type) {
      case "SELL":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "RENT":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "LEASE":
        return "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200";
      case "STAY":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 relative">
      <AnimatedBackground />
      <Header />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-6 py-8"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground dark:text-white">List New Property</h1>
              <p className="text-muted-foreground dark:text-gray-300">
                Fill in the details below to list your property for {formData.type.toLowerCase()}.
              </p>
            </div>
          </div>

          {/* Property Type Selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(["SELL", "RENT", "LEASE", "STAY"] as const).map((type) => (
              <Badge
                key={type}
                className={`px-4 py-2 cursor-pointer transition-all duration-200 ${
                  formData.type === type
                    ? getTypeColor(type) + " ring-2 ring-primary"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                onClick={() => handleInputChange("type", type)}
              >
                {type}
              </Badge>
            ))}
          </div>

          <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Approval Required</AlertTitle>
            <AlertDescription>
              Your property will be reviewed by our team before going live. This usually takes 24-48 hours.
            </AlertDescription>
          </Alert>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground dark:text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground dark:text-white">
                    Property Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Luxury 3BR Apartment in Lekki"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-foreground dark:text-white">
                    Price (₦) *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="e.g., 8500000"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      className={`pl-10 ${errors.price ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground dark:text-white">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your property, including key features, neighborhood, and any special notes..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={5}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Location & Map */}
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground dark:text-white">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-foreground dark:text-white">
                  Address *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="location"
                    placeholder="e.g., 123 Victoria Island, Lagos"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className={`pl-10 ${errors.location ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
              </div>

              {/* Map Placeholder — Replace with Google Maps/Mapbox */}
              <div className="border border-border rounded-lg overflow-hidden h-64 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground dark:text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground dark:text-gray-300">
                    Interactive map will be displayed here (Google Maps/Mapbox integration)
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-2">
                    Click on map to set exact coordinates
                  </p>
                </div>
              </div>

              <Alert className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700">
                <Clock className="h-4 w-4" />
                <AlertTitle>Location Accuracy</AlertTitle>
                <AlertDescription>
                  Ensure the location pin is accurate — this affects search visibility and user experience.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground dark:text-white">Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms" className="text-foreground dark:text-white">
                    Bedrooms *
                  </Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    placeholder="e.g., 3"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                    className={errors.bedrooms ? "border-red-500" : ""}
                  />
                  {errors.bedrooms && <p className="text-red-500 text-sm">{errors.bedrooms}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms" className="text-foreground dark:text-white">
                    Bathrooms *
                  </Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    placeholder="e.g., 2"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange("bathrooms", e.target.value)}
                    className={errors.bathrooms ? "border-red-500" : ""}
                  />
                  {errors.bathrooms && <p className="text-red-500 text-sm">{errors.bathrooms}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area" className="text-foreground dark:text-white">
                    Area (sqm) *
                  </Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="e.g., 120"
                    value={formData.area}
                    onChange={(e) => handleInputChange("area", e.target.value)}
                    className={errors.area ? "border-red-500" : ""}
                  />
                  {errors.area && <p className="text-red-500 text-sm">{errors.area}</p>}
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <Label className="text-foreground dark:text-white">Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {AMENITIES.map((amenity) => (
                    <div
                      key={amenity}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.amenities.includes(amenity)
                          ? "border-primary bg-primary/10 dark:bg-primary/20"
                          : "border-border hover:border-primary/50 dark:border-gray-700"
                      }`}
                      onClick={() => toggleAmenity(amenity)}
                    >
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground dark:text-white">{amenity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground dark:text-white">Property Images *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    errors.images ? "border-red-500" : "border-border hover:border-primary"
                  }`}
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  <Upload className="h-12 w-12 text-muted-foreground dark:text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground dark:text-gray-300">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    PNG, JPG, GIF up to 10MB (Max 10 images)
                  </p>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                {errors.images && <p className="text-red-500 text-sm">{errors.images}</p>}

                {previewImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
                    {previewImages.map((src, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={src}
                          alt={`Property ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/host/dashboard")}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </div>
              ) : (
                "Submit for Verification"
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}