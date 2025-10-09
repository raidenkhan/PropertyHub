"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const testimonials = [
  {
    id: 1,
    name: "Adaora Okechukwu",
    role: "Property Investor",
    location: "Lagos",
    image: "/testimonials/user1.jpg",
    rating: 5,
    text: "PropertyHub made finding my dream apartment incredibly easy. The search filters are precise and the property photos are high-quality. I found the perfect place within a week!",
    propertyType: "3-bedroom apartment"
  },
  {
    id: 2,
    name: "Ibrahim Mohammed",
    role: "Business Owner",
    location: "Abuja",
    image: "/testimonials/user2.jpg",
    rating: 5,
    text: "As a first-time property buyer, I was overwhelmed. PropertyHub's agents guided me through every step. Their expertise and patience made the entire process seamless.",
    propertyType: "Commercial space"
  },
  {
    id: 3,
    name: "Grace Emeka",
    role: "Software Developer",
    location: "Port Harcourt",
    image: "/testimonials/user3.jpg",
    rating: 5,
    text: "The virtual tours feature is fantastic! I could explore properties from anywhere. Found and secured my new home without multiple site visits. Highly recommended!",
    propertyType: "2-bedroom house"
  },
  {
    id: 4,
    name: "Olumide Adebayo",
    role: "Real Estate Agent",
    location: "Ibadan",
    image: "/testimonials/user4.jpg",
    rating: 5,
    text: "PropertyHub has revolutionized how I showcase properties to clients. The platform is professional, user-friendly, and has significantly increased my sales conversions.",
    propertyType: "Multiple listings"
  }
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1)
  }

  return (
    <section className="py-20 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Clients Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it. Here's what thousands of satisfied clients have to say about their PropertyHub experience.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-background rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 relative"
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 left-6">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Quote className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4 pt-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={testimonial.image} alt={testimonial.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {testimonial.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    {testimonial.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role} • {testimonial.location}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    Bought: {testimonial.propertyType}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-background rounded-2xl p-8 shadow-lg border border-border/50"
        >
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-primary mb-2">4.9/5</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary mb-2">5,000+</div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Customer Support</div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to Find Your Perfect Property?
          </h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of satisfied clients who found their dream properties with PropertyHub
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="px-8 py-3 rounded-xl">
              Start Property Search
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 rounded-xl">
              List Your Property
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}