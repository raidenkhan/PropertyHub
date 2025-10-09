// Mobile-first resource loading utility with device detection and optimization
import { apiClient } from '@/lib/api/enhancedApiClient';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  connectionType: string;
  isLowEndDevice: boolean;
  prefersReducedMotion: boolean;
  memoryInfo?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export interface MobileOptimizationConfig {
  enableImageCompression: boolean;
  enableLazyLoading: boolean;
  enableDataSaving: boolean;
  maxImageSize: number;
  preferredImageFormat: 'webp' | 'jpg' | 'png';
  reducedAnimations: boolean;
  limitConcurrentRequests: number;
}

class MobileOptimization {
  private static instance: MobileOptimization;
  private deviceInfo: DeviceInfo | null = null;
  private config: MobileOptimizationConfig;
  private networkObserver: any = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private prefetchQueue: Set<string> = new Set();
  private activeRequests = 0;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeDeviceDetection();
    this.setupNetworkMonitoring();
    this.setupIntersectionObserver();
  }

  static getInstance(): MobileOptimization {
    if (!MobileOptimization.instance) {
      MobileOptimization.instance = new MobileOptimization();
    }
    return MobileOptimization.instance;
  }

  // Initialize device detection
  private initializeDeviceDetection(): void {
    if (typeof window === 'undefined') return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const isMobile = screenWidth <= 768;
    const isTablet = screenWidth > 768 && screenWidth <= 1024;
    const isDesktop = screenWidth > 1024;

    // Detect low-end device based on various metrics
    const isLowEndDevice = this.detectLowEndDevice();

    // Check connection type
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const connectionType = connection ? connection.effectiveType || 'unknown' : 'unknown';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Memory information (if available)
    const memoryInfo = (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    } : undefined;

    this.deviceInfo = {
      isMobile,
      isTablet,
      isDesktop,
      screenWidth,
      screenHeight,
      devicePixelRatio,
      connectionType,
      isLowEndDevice,
      prefersReducedMotion,
      memoryInfo,
    };

    // Adjust config based on device
    this.config = this.getOptimizedConfig(this.deviceInfo);
  }

  // Detect low-end device using various metrics
  private detectLowEndDevice(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      // Check hardware concurrency (number of CPU cores)
      const cores = navigator.hardwareConcurrency || 2;
      if (cores <= 2) return true;

      // Check memory if available
      const memory = (navigator as any).deviceMemory;
      if (memory && memory <= 2) return true;

      // Check connection type
      const connection = (navigator as any).connection;
      if (connection && ['slow-2g', '2g'].includes(connection.effectiveType)) {
        return true;
      }

      // Check performance timing
      const timing = performance.timing;
      if (timing) {
        const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        if (pageLoadTime > 5000) return true; // Page took more than 5 seconds to load
      }

      return false;
    } catch (error) {
      console.warn('Error detecting device performance:', error);
      return false;
    }
  }

  // Get default configuration
  private getDefaultConfig(): MobileOptimizationConfig {
    return {
      enableImageCompression: true,
      enableLazyLoading: true,
      enableDataSaving: false,
      maxImageSize: 1024, // 1MB
      preferredImageFormat: 'webp',
      reducedAnimations: false,
      limitConcurrentRequests: 6,
    };
  }

  // Get optimized config based on device capabilities
  private getOptimizedConfig(deviceInfo: DeviceInfo): MobileOptimizationConfig {
    const config = { ...this.getDefaultConfig() };

    if (deviceInfo.isMobile) {
      config.maxImageSize = 512; // 512KB for mobile
      config.limitConcurrentRequests = 4;
      config.enableDataSaving = ['slow-2g', '2g', '3g'].includes(deviceInfo.connectionType);
    }

    if (deviceInfo.isLowEndDevice) {
      config.maxImageSize = 256; // 256KB for low-end devices
      config.limitConcurrentRequests = 2;
      config.reducedAnimations = true;
      config.enableDataSaving = true;
      config.preferredImageFormat = 'jpg'; // More widely supported
    }

    if (deviceInfo.prefersReducedMotion) {
      config.reducedAnimations = true;
    }

    // Adjust based on connection quality
    if (['slow-2g', '2g'].includes(deviceInfo.connectionType)) {
      config.maxImageSize = 128; // 128KB for very slow connections
      config.limitConcurrentRequests = 1;
      config.enableDataSaving = true;
      config.enableLazyLoading = true;
    }

    return config;
  }

  // Setup network monitoring
  private setupNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const updateConnectionInfo = () => {
        if (this.deviceInfo) {
          this.deviceInfo.connectionType = connection.effectiveType || 'unknown';
          this.config = this.getOptimizedConfig(this.deviceInfo);
        }
      };

      connection.addEventListener('change', updateConnectionInfo);
      this.networkObserver = () => connection.removeEventListener('change', updateConnectionInfo);
    }
  }

  // Setup intersection observer for lazy loading
  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !window.IntersectionObserver) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const url = element.dataset.preloadUrl;
            
            if (url && !this.prefetchQueue.has(url)) {
              this.prefetchResource(url);
              this.intersectionObserver?.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before element is visible
        threshold: 0.1,
      }
    );
  }

  // Get current device info
  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  // Get current configuration
  getConfig(): MobileOptimizationConfig {
    return { ...this.config };
  }

  // Optimize image URL based on device capabilities
  optimizeImageUrl(originalUrl: string, width?: number, height?: number): string {
    if (!this.deviceInfo) return originalUrl;

    const params = new URLSearchParams();
    
    // Set format
    params.set('format', this.config.preferredImageFormat);
    
    // Set quality based on device and connection
    let quality = 80;
    if (this.deviceInfo.isLowEndDevice || this.config.enableDataSaving) {
      quality = 60;
    }
    if (['slow-2g', '2g'].includes(this.deviceInfo.connectionType)) {
      quality = 40;
    }
    params.set('q', quality.toString());

    // Set dimensions based on screen size and pixel ratio
    const maxWidth = width || Math.min(this.deviceInfo.screenWidth * this.deviceInfo.devicePixelRatio, 1920);
    const maxHeight = height || Math.min(this.deviceInfo.screenHeight * this.deviceInfo.devicePixelRatio, 1080);
    
    if (this.deviceInfo.isMobile) {
      params.set('w', Math.min(maxWidth, 800).toString());
      params.set('h', Math.min(maxHeight, 800).toString());
    } else {
      params.set('w', maxWidth.toString());
      params.set('h', maxHeight.toString());
    }

    // Add progressive loading for supported formats
    if (this.config.preferredImageFormat === 'webp') {
      params.set('progressive', 'true');
    }

    return `${originalUrl}?${params.toString()}`;
  }

  // Prefetch resource with rate limiting
  async prefetchResource(url: string): Promise<void> {
    if (this.prefetchQueue.has(url) || this.activeRequests >= this.config.limitConcurrentRequests) {
      return;
    }

    // Skip prefetching on slow connections or data saving mode
    if (this.config.enableDataSaving || ['slow-2g', '2g'].includes(this.deviceInfo?.connectionType || '')) {
      return;
    }

    this.prefetchQueue.add(url);
    this.activeRequests++;

    try {
      await apiClient.request(url, {
        priority: 'low',
        useCache: true,
        cacheExpiry: 30 * 60 * 1000, // Cache for 30 minutes
      });
    } catch (error) {
      console.warn('Prefetch failed:', error);
    } finally {
      this.activeRequests--;
    }
  }

  // Register element for intersection-based prefetching
  observeElement(element: HTMLElement, url: string): void {
    if (!this.intersectionObserver) return;

    element.dataset.preloadUrl = url;
    this.intersectionObserver.observe(element);
  }

  // Get optimized loading strategy for components
  getLoadingStrategy(): {
    shouldLazyLoad: boolean;
    shouldCompress: boolean;
    shouldPrefetch: boolean;
    maxConcurrency: number;
    imageQuality: number;
  } {
    if (!this.deviceInfo) {
      return {
        shouldLazyLoad: true,
        shouldCompress: true,
        shouldPrefetch: false,
        maxConcurrency: 4,
        imageQuality: 75,
      };
    }

    let imageQuality = 80;
    if (this.deviceInfo.isLowEndDevice || this.config.enableDataSaving) {
      imageQuality = 60;
    }
    if (['slow-2g', '2g'].includes(this.deviceInfo.connectionType)) {
      imageQuality = 40;
    }

    return {
      shouldLazyLoad: this.config.enableLazyLoading,
      shouldCompress: this.config.enableImageCompression,
      shouldPrefetch: !this.config.enableDataSaving && this.activeRequests < 2,
      maxConcurrency: this.config.limitConcurrentRequests,
      imageQuality,
    };
  }

  // Get reduced motion preference
  shouldReduceMotion(): boolean {
    return this.config.reducedAnimations || (this.deviceInfo?.prefersReducedMotion ?? false);
  }

  // Load component conditionally based on device capabilities
  shouldLoadComponent(componentName: string): boolean {
    if (!this.deviceInfo) return true;

    // Skip heavy components on low-end devices
    const heavyComponents = ['3DViewer', 'VideoPlayer', 'InteractiveMap'];
    if (this.deviceInfo.isLowEndDevice && heavyComponents.includes(componentName)) {
      return false;
    }

    // Skip non-essential components on slow connections
    const nonEssentialComponents = ['ChatWidget', 'RecommendationEngine', 'SocialShare'];
    if (['slow-2g', '2g'].includes(this.deviceInfo.connectionType) && nonEssentialComponents.includes(componentName)) {
      return false;
    }

    return true;
  }

  // Get bundle loading strategy
  getBundleLoadingStrategy(): {
    strategy: 'eager' | 'lazy' | 'preload';
    chunkSize: 'small' | 'medium' | 'large';
  } {
    if (!this.deviceInfo) {
      return { strategy: 'lazy', chunkSize: 'medium' };
    }

    if (this.deviceInfo.isLowEndDevice || ['slow-2g', '2g'].includes(this.deviceInfo.connectionType)) {
      return { strategy: 'lazy', chunkSize: 'small' };
    }

    if (this.deviceInfo.isMobile) {
      return { strategy: 'lazy', chunkSize: 'medium' };
    }

    return { strategy: 'preload', chunkSize: 'large' };
  }

  // Cleanup resources
  cleanup(): void {
    if (this.networkObserver) {
      this.networkObserver();
      this.networkObserver = null;
    }

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    this.prefetchQueue.clear();
  }
}

// Create singleton instance
export const mobileOptimization = MobileOptimization.getInstance();

// Utility hooks and functions
export const useMobileOptimization = () => {
  const deviceInfo = mobileOptimization.getDeviceInfo();
  const config = mobileOptimization.getConfig();
  
  return {
    deviceInfo,
    config,
    optimizeImageUrl: (url: string, width?: number, height?: number) => 
      mobileOptimization.optimizeImageUrl(url, width, height),
    getLoadingStrategy: () => mobileOptimization.getLoadingStrategy(),
    shouldReduceMotion: () => mobileOptimization.shouldReduceMotion(),
    shouldLoadComponent: (name: string) => mobileOptimization.shouldLoadComponent(name),
    getBundleLoadingStrategy: () => mobileOptimization.getBundleLoadingStrategy(),
    observeElement: (element: HTMLElement, url: string) => 
      mobileOptimization.observeElement(element, url),
  };
};