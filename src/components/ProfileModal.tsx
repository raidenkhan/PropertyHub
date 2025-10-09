"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Phone, MapPin, Calendar, Shield, Edit3, Save, Camera, Star, Award, Building, Heart } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { useAuth } from '@/lib/auth/authContext'
import { toast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || ''
      })
    }
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      // Update user context
      // await updateUser(formData)
      
      toast({
        title: "✅ Profile Updated",
        description: "Your profile has been successfully updated.",
      })
      
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "❌ Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || ''
      })
    }
    setIsEditing(false)
  }

  if (!user) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ 
                type: "spring", 
                duration: 0.3, 
                bounce: 0.1 
              }}
              className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-blue-50/50 to-violet-50/50 dark:from-blue-950/30 dark:to-violet-950/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">My Profile</h2>
                    <p className="text-sm text-muted-foreground">Manage your account information</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="rounded-full h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="p-6 space-y-6">
                  {/* Profile Header */}
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-500 text-white text-2xl font-bold">
                          {(user.name?.charAt(0) || 'U').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-background"
                      >
                        <Camera className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="text-center sm:text-left flex-1">
                      <h3 className="text-2xl font-bold text-foreground">{user.name}</h3>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                        <Badge variant="secondary" className="capitalize">
                          {user.roles?.[0] || 'Member'}
                        </Badge>
                        {user.isVerified && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-2">
                        Member since {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-foreground">0</div>
                        <div className="text-xs text-muted-foreground">Saved</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <Building className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-foreground">0</div>
                        <div className="text-xs text-muted-foreground">Listed</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-foreground">5.0</div>
                        <div className="text-xs text-muted-foreground">Rating</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-foreground">0</div>
                        <div className="text-xs text-muted-foreground">Reviews</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {/* Profile Information */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Profile Information</CardTitle>
                      {!isEditing ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isLoading}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {isLoading ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Full Name
                          </label>
                          {isEditing ? (
                            <Input
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              placeholder="Enter your full name"
                            />
                          ) : (
                            <p className="text-foreground py-2 px-3 bg-muted/30 rounded-md">
                              {user.name || 'Not provided'}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email Address
                          </label>
                          <p className="text-foreground py-2 px-3 bg-muted/30 rounded-md">
                            {user.email}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </label>
                          {isEditing ? (
                            <Input
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              placeholder="Enter your phone number"
                            />
                          ) : (
                            <p className="text-foreground py-2 px-3 bg-muted/30 rounded-md">
                              {user.phone || 'Not provided'}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Location
                          </label>
                          {isEditing ? (
                            <Input
                              value={formData.location}
                              onChange={(e) => handleInputChange('location', e.target.value)}
                              placeholder="Enter your location"
                            />
                          ) : (
                            <p className="text-foreground py-2 px-3 bg-muted/30 rounded-md">
                              {user.location || 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Bio
                        </label>
                        {isEditing ? (
                          <Textarea
                            value={formData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={3}
                          />
                        ) : (
                          <p className="text-foreground py-2 px-3 bg-muted/30 rounded-md min-h-[80px]">
                            {user.bio || 'No bio provided'}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}