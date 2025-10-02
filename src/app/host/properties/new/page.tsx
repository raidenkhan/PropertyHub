"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
//import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, MapPin, DollarSign, Home, Clock, Star, CheckCircle, XCircle, Search, Navigation } from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";
import { toast } from "@/hooks/use-toast";
import { propertyService } from '@/lib/api/propertyService';
import { AnimatedBackground } from "@/components/animated-background";

// Mapbox imports
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'your-mapbox-token-here';

// Image compression utility
const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original file
          }
        },
        file.type,
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Types
interface PropertyFormData {
  title: string;
  description: string;
  type: "APPARTMENT" | "OFFICE" | "LAND" | "COMMERCIAL";
  price: string;
  location: string;
  coordinates: { lat: number; lng: number } | null;
  bedrooms: string;
  bathrooms: string;
  area: string;
  amenities: string[];
  images: File[];
}

interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
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
interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
}
export default function NewPropertyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    type: "APPARTMENT",
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
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 6.5244, // Lagos default
    lng: 3.3792,
  });
  
  // Mapbox-specific states
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [mapCenter.lng, mapCenter.lat],
      zoom: 12,
      attributionControl: false,
    });

    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add click handler for map
    map.current.on('click', handleMapClick);

    // Initialize with default marker
    updateMapMarker(mapCenter.lat, mapCenter.lng);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Get user's current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(newCenter);
          
          if (map.current) {
            map.current.setCenter([newCenter.lng, newCenter.lat]);
            updateMapMarker(newCenter.lat, newCenter.lng);
          }
        },
        (error) => {
          console.warn('Geolocation failed:', error);
          // Keep default Lagos location
        }
      );
    }
  }, []);

  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    const { lng, lat } = e.lngLat;
    
    setFormData(prev => ({ 
      ...prev, 
      coordinates: { lat, lng } 
    }));
    
    updateMapMarker(lat, lng);
    
    // Reverse geocoding to get address
    reverseGeocode(lat, lng);
  }, []);

  const updateMapMarker = (lat: number, lng: number) => {
    if (!map.current) return;
    
    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }
    
    // Add new marker
    marker.current = new mapboxgl.Marker({
      color: '#3b82f6',
      draggable: true
    })
      .setLngLat([lng, lat])
      .addTo(map.current);
    
    // Handle marker drag
    marker.current.on('dragend', () => {
      if (!marker.current) return;
      const lngLat = marker.current.getLngLat();
      setFormData(prev => ({ 
        ...prev, 
        coordinates: { lat: lngLat.lat, lng: lngLat.lng } 
      }));
      reverseGeocode(lngLat.lat, lngLat.lng);
    });
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&types=address,poi`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        setFormData(prev => ({ ...prev, location: address }));
        setSearchQuery(address);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingLocation(true);
    try {
      // Bias search results towards Nigeria
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&country=ng&limit=5&types=address,poi,place`
      );
      const data = await response.json();
      
      if (data.features) {
        const searchSuggestions: Suggestion[] = data.features.map((feature: MapboxFeature) => ({
          id: feature.id,
          place_name: feature.place_name,
          center: feature.center,
          place_type: feature.place_type,
        }));
        setSuggestions(searchSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Location search failed:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const selectSuggestion = (suggestion: Suggestion) => {
    const [lng, lat] = suggestion.center;
    
    setFormData(prev => ({ 
      ...prev, 
      location: suggestion.place_name,
      coordinates: { lat, lng }
    }));
    
    setSearchQuery(suggestion.place_name);
    setShowSuggestions(false);
    
    if (map.current) {
      map.current.setCenter([lng, lat]);
      map.current.setZoom(16);
      updateMapMarker(lat, lng);
    }
  };

  const getCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
      });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        setFormData(prev => ({ 
          ...prev, 
          coordinates: { lat, lng } 
        }));
        
        if (map.current) {
          map.current.setCenter([lng, lat]);
          map.current.setZoom(16);
          updateMapMarker(lat, lng);
        }
        
        reverseGeocode(lat, lng);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location access denied",
          description: "Please allow location access or search manually.",
        });
        setIsLoadingLocation(false);
      }
    );
  };

  const handleInputChange = (field: string, value: string | File[] | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleLocationSearch = (value: string) => {
    setSearchQuery(value);
    handleInputChange("location", value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchLocation(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + formData.images.length > 10) {
        toast({
          title: "Too many images",
          description: "You can upload a maximum of 10 images.",
        });
        return;
      }

      setIsProcessingImages(true);
      
      try {
        // Validate file types and sizes
        const validFiles: File[] = [];
        const validPreviews: string[] = [];
        
        for (const file of files) {
          // Check file type
          if (!file.type.startsWith('image/')) {
            toast({
              title: "Invalid file type",
              description: `${file.name} is not an image file.`,
            });
            continue;
          }

          let fileToUse = file;
          
          // Compress large images client-side for faster upload
          if (file.size > 2 * 1024 * 1024) { // compress if > 2MB
            fileToUse = await compressImage(file, 1600, 0.8);
          }
          
          // Enforce 10MB max size even after compression
          if (fileToUse.size > 10 * 1024 * 1024) {
            toast({
              title: "File too large",
              description: `${file.name} is larger than 10MB even after compression.`,
            });
            continue;
          }
          
          validFiles.push(fileToUse);
          
          // Generate preview with a small delay to show loading
          await new Promise(resolve => setTimeout(resolve, 100));
          const previewUrl = URL.createObjectURL(fileToUse);
          validPreviews.push(previewUrl);
        }
        
        if (validFiles.length > 0) {
          handleInputChange("images", [...formData.images, ...validFiles]);
          setPreviewImages((prev) => [...prev, ...validPreviews]);
          
          toast({
            title: "Images uploaded",
            description: `${validFiles.length} image(s) added successfully.`,
          });
        }
      } catch (error) {
        console.error('Error processing images:', error);
        toast({
          title: "Upload failed",
          description: "Failed to process images. Please try again.",
        });
      } finally {
        setIsProcessingImages(false);
        // Reset the input
        e.target.value = '';
      }
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
      newErrors.location = "Please select location on map";
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
        console.log("Submitting")
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
console.log(formDataToSend)
      const result = await propertyService.createPropertyWithFiles(formDataToSend);
      if(result){
        console.log("Response results", result)
        
        // Enhanced success notification
        toast({
          title: "✅ Property Listed Successfully!",
          description: `"${formData.title}" has been submitted for review. You'll receive an email notification once it's approved (usually within 24-48 hours).`,
        });
        
        // Show a follow-up toast with next steps
        setTimeout(() => {
          toast({
            title: "📊 Track Your Listing",
            description: "You can track the review status from your dashboard.",
          });
        }, 3000);
        
        // Redirect after a short delay to allow user to see the success message
        setTimeout(() => {
          router.push("/host/dashboard");
        }, 1500);
      }

      // Redirect to Host Dashboard
    } catch (error: any) {
      console.error('Property submission error:', error);
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      // Provide specific error messages based on error type
      if (error.message?.includes('network')) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message?.includes('file')) {
        errorMessage = "File upload failed. Please try uploading smaller images.";
      } else if (error.message?.includes('validation')) {
        errorMessage = "Please check all required fields and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "⚠️ Submission Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Show retry guidance after a delay
      setTimeout(() => {
        toast({
          title: "💡 Need Help?",
          description: "Contact support if the problem persists.",
        });
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeColor = (type: PropertyFormData["type"]) => {
    switch (type) {
      case "APPARTMENT":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "OFFICE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "LAND":
        return "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200";
      case "COMMERCIAL":
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
            {(["APPARTMENT", "COMMERCIAL", "OFFCIE", "LAND"] as const).map((type) => (
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
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
                  <Input
                    id="location"
                    placeholder="Search for address or place..."
                    value={searchQuery}
                    onChange={(e) => handleLocationSearch(e.target.value)}
                    className={`pl-10 pr-20 ${errors.location ? "border-red-500" : ""}`}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={getCurrentLocation}
                      disabled={isLoadingLocation}
                      className="p-1 h-8 w-8"
                    >
                      <Navigation className={`w-4 h-4 ${isLoadingLocation ? 'animate-pulse' : ''}`} />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => searchLocation(searchQuery)}
                      disabled={isLoadingLocation}
                      className="p-1 h-8 w-8"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}

                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground dark:text-white">
                            {suggestion.place_name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive Mapbox Map */}
              <div className="border border-border rounded-lg overflow-hidden h-96 bg-gray-100 dark:bg-gray-800 relative">
                <div 
                  ref={mapContainer} 
                  className="w-full h-full"
                  style={{ minHeight: '384px' }}
                />
                
                {/* Map Instructions Overlay */}
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-foreground dark:text-white">
                      Pin Location
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-gray-300">
                    Click on the map or drag the marker to set your property's exact location
                  </p>
                </div>

                {/* Coordinates Display */}
                {formData.coordinates && (
                  <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                    <p className="text-xs text-muted-foreground dark:text-gray-300">
                      {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                    </p>
                  </div>
                )}
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
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors relative ${
                    isProcessingImages 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : errors.images 
                        ? "border-red-500" 
                        : "border-border hover:border-primary cursor-pointer"
                  }`}
                  onClick={() => !isProcessingImages && document.getElementById("image-upload")?.click()}
                >
                  {isProcessingImages ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-blue-600 dark:text-blue-400 font-medium">
                        Processing images...
                      </p>
                      <p className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                        Please wait while we process your files
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-muted-foreground dark:text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground dark:text-gray-300">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                        PNG, JPG, GIF up to 10MB (Max 10 images)
                      </p>
                    </>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isProcessingImages}
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
              onClick={handleSubmit}
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