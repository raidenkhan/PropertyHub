// Performance monitoring utilities
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map()
  
  static mark(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name)
      this.marks.set(name, Date.now())
    }
  }
  
  static measure(name: string, startMark: string, endMark?: string): number | null {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        if (endMark) {
          window.performance.measure(name, startMark, endMark)
        } else {
          window.performance.measure(name, startMark)
        }
        
        const entries = window.performance.getEntriesByName(name, 'measure')
        const entry = entries[entries.length - 1]
        return entry ? entry.duration : null
      } catch (error) {
        console.warn('Performance measurement failed:', error)
        return null
      }
    }
    return null
  }
  
  static getMarks(): PerformanceEntryList {
    if (typeof window !== 'undefined' && window.performance) {
      return window.performance.getEntriesByType('mark')
    }
    return []
  }
  
  static getMeasures(): PerformanceEntryList {
    if (typeof window !== 'undefined' && window.performance) {
      return window.performance.getEntriesByType('measure')
    }
    return []
  }
  
  static clearMarks(name?: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      if (name) {
        window.performance.clearMarks(name)
        this.marks.delete(name)
      } else {
        window.performance.clearMarks()
        this.marks.clear()
      }
    }
  }
  
  static clearMeasures(name?: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      if (name) {
        window.performance.clearMeasures(name)
      } else {
        window.performance.clearMeasures()
      }
    }
  }
  
  // Track Core Web Vitals
  static trackWebVitals(): void {
    if (typeof window === 'undefined') return
    
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            console.log('FCP:', entry.startTime)
            // Send to analytics
            this.sendMetric('FCP', entry.startTime)
          }
        })
      })
      observer.observe({ entryTypes: ['paint'] })
    }
    
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        console.log('LCP:', lastEntry.startTime)
        this.sendMetric('LCP', lastEntry.startTime)
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    }
    
    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        console.log('CLS:', clsValue)
        this.sendMetric('CLS', clsValue)
      })
      observer.observe({ entryTypes: ['layout-shift'] })
    }
  }
  
  private static sendMetric(name: string, value: number): void {
    // Send to your analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name}: ${value}`)
    }
    // Example: analytics.track('performance_metric', { name, value })
  }
  
  // Debounced function utility for reducing excessive calls
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }
  
  // Throttle utility for limiting function calls
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }
}