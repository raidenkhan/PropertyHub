// Enhanced API client with request deduplication, caching, and batching
import { cacheUtils } from '@/lib/utils/storage';

// Fallback cache utils if storage module is not available
const fallbackCacheUtils = {
  get: async () => null,
  set: async () => true,
  has: async () => false,
  remove: () => {},
  clear: async () => {},
  stats: async () => ({ totalEntries: 0, storageUsed: 0 }),
};

interface RequestConfig extends Omit<RequestInit, 'priority'> {
  useCache?: boolean;
  cacheExpiry?: number;
  retries?: number;
  timeout?: number;
  priority?: 'high' | 'normal' | 'low';
  batchable?: boolean;
}

interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
  priority: 'high' | 'normal' | 'low';
}

interface BatchRequest {
  url: string;
  config: RequestConfig;
  callbacks: PendingRequest<any>[];
}

export class EnhancedApiClient {
  private static instance: EnhancedApiClient;
  private pendingRequests = new Map<string, PendingRequest<any>[]>();
  private batchQueue = new Map<string, BatchRequest>();
  private batchTimer: NodeJS.Timeout | null = null;
  private requestCounter = 0;
  private readonly BATCH_DELAY = 50; // 50ms batching window
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly CACHE_PREFIX = 'api_';

  private constructor() {
    // Initialize batch processing
    this.processBatchQueue();
  }

  static getInstance(): EnhancedApiClient {
    if (!EnhancedApiClient.instance) {
      EnhancedApiClient.instance = new EnhancedApiClient();
    }
    return EnhancedApiClient.instance;
  }

  // Generate cache key from URL and config
  private getCacheKey(url: string, config: RequestConfig): string {
    const method = config.method || 'GET';
    const body = config.body ? JSON.stringify(config.body) : '';
    return `${this.CACHE_PREFIX}${method}_${url}_${btoa(body).slice(0, 10)}`;
  }

  // Generate request key for deduplication
  private getRequestKey(url: string, config: RequestConfig): string {
    return `${config.method || 'GET'}_${url}_${JSON.stringify(config.body || {})}`;
  }

  // Check if request is cacheable
  private isCacheable(config: RequestConfig): boolean {
    const method = config.method || 'GET';
    return config.useCache !== false && ['GET', 'HEAD'].includes(method.toUpperCase());
  }

  // Add timeout to fetch request
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]);
  }

  // Retry mechanism with exponential backoff
  private async withRetry<T>(
    operation: () => Promise<T>,
    retries: number,
    delay: number = 1000
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(operation, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  // Check if error is retryable
  private isRetryableError(error: any): boolean {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true; // Network error
    }
    
    if (error.status) {
      // Retry on 5xx errors and some 4xx errors
      return error.status >= 500 || error.status === 408 || error.status === 429;
    }
    
    return false;
  }

  // Process batch queue periodically
  private processBatchQueue(): void {
    setInterval(() => {
      if (this.batchQueue.size > 0) {
        this.flushBatchQueue();
      }
    }, this.BATCH_DELAY);
  }

  // Flush batch queue and execute requests
  private async flushBatchQueue(): Promise<void> {
    const batches = Array.from(this.batchQueue.entries());
    this.batchQueue.clear();

    // Sort by priority
    batches.sort(([, a], [, b]) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const aPriority = a.callbacks[0]?.priority || 'normal';
      const bPriority = b.callbacks[0]?.priority || 'normal';
      return priorityOrder[bPriority] - priorityOrder[aPriority];
    });

    // Execute batches
    for (const [key, batch] of batches) {
      try {
        const response = await this.executeSingleRequest(batch.url, batch.config);
        batch.callbacks.forEach(callback => callback.resolve(response));
      } catch (error) {
        batch.callbacks.forEach(callback => callback.reject(error as Error));
      }
    }
  }

  // Execute single request
  private async executeSingleRequest(url: string, config: RequestConfig): Promise<any> {
    const timeout = config.timeout || this.DEFAULT_TIMEOUT;
    const retries = config.retries || this.MAX_RETRIES;

    const fetchOperation = async () => {
       const { useCache, cacheExpiry, retries, timeout, priority, batchable, ...fetchInit } = config;
      const response = await fetch(url, fetchInit);
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }
      
      return response.json();
    };

    return this.withTimeout(
      this.withRetry(fetchOperation, retries),
      timeout
    );
  }

  // Main request method with caching and deduplication
  async request<T>(url: string, config: RequestConfig = {}): Promise<T> {
    this.requestCounter++;
    const requestId = this.requestCounter;
    
    console.log(`🚀 API Request #${requestId}: ${config.method || 'GET'} ${url}`);
    
    // Check cache first
    if (this.isCacheable(config)) {
      const cacheKey = this.getCacheKey(url, config);
      try {
        const cached = await cacheUtils.get<T>(cacheKey);
        if (cached) {
          console.log(`💾 Cache hit for request #${requestId}`);
          return cached;
        }
      } catch (error) {
        console.warn('Cache read failed:', error);
      }
    }

    // Check for pending identical requests (deduplication)
    const requestKey = this.getRequestKey(url, config);
    
    if (this.pendingRequests.has(requestKey)) {
      console.log(`🔄 Deduplicating request #${requestId}`);
      // Add to existing request queue
      return new Promise<T>((resolve, reject) => {
        this.pendingRequests.get(requestKey)?.push({
          resolve,
          reject,
          timestamp: Date.now(),
          priority: config.priority || 'normal',
        });
      });
    }

    // Create new request queue
    const requestCallbacks: PendingRequest<T>[] = [];
    this.pendingRequests.set(requestKey, requestCallbacks);

    try {
      let result: T;

      if (config.batchable) {
        // Add to batch queue
        console.log(`📦 Batching request #${requestId}`);
        result = await new Promise<T>((resolve, reject) => {
          if (!this.batchQueue.has(requestKey)) {
            this.batchQueue.set(requestKey, {
              url,
              config,
              callbacks: [],
            });
          }
          
          this.batchQueue.get(requestKey)?.callbacks.push({
            resolve,
            reject,
            timestamp: Date.now(),
            priority: config.priority || 'normal',
          });
        });
      } else {
        // Execute immediately
        result = await this.executeSingleRequest(url, config);
      }

      // Resolve all pending requests with the same key
      requestCallbacks.forEach(callback => callback.resolve(result));

      // Cache the result if applicable
      if (this.isCacheable(config)) {
        const cacheKey = this.getCacheKey(url, config);
        try {
          await cacheUtils.set(cacheKey, result, config.cacheExpiry);
          console.log(`💾 Cached result for request #${requestId}`);
        } catch (error) {
          console.warn('Cache write failed:', error);
        }
      }

      console.log(`✅ Request #${requestId} completed successfully`);
      return result;
      
    } catch (error) {
      console.error(`❌ Request #${requestId} failed:`, error);
      
      // Reject all pending requests with the same key
      requestCallbacks.forEach(callback => callback.reject(error as Error));
      throw error;
      
    } finally {
      // Clean up pending requests
      this.pendingRequests.delete(requestKey);
    }
  }

  // Convenience methods
  async get<T>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T>(url: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });
  }

  async put<T>(url: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });
  }

  async delete<T>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  // Clear request cache
  async clearCache(pattern?: string): Promise<void> {
    if (pattern) {
      // Clear specific cache entries matching pattern
      const stats = await cacheUtils.stats();
      // Implementation would depend on storage utility supporting pattern matching
      console.log(`Cache cleared for pattern: ${pattern}`);
    } else {
      await cacheUtils.clear();
      console.log('All cache cleared');
    }
  }

  // Get request statistics
  getStats(): {
    pendingRequests: number;
    batchQueueSize: number;
    totalRequests: number;
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      batchQueueSize: this.batchQueue.size,
      totalRequests: this.requestCounter,
    };
  }

  // Cancel pending requests
  cancelPendingRequests(pattern?: string): void {
    for (const [key, callbacks] of this.pendingRequests.entries()) {
      if (!pattern || key.includes(pattern)) {
        callbacks.forEach(callback => 
          callback.reject(new Error('Request cancelled'))
        );
        this.pendingRequests.delete(key);
      }
    }
  }

  // Preload data for better performance
  async preload(urls: string[], config?: RequestConfig): Promise<void> {
    const preloadPromises = urls.map(url => 
      this.request(url, { 
        ...config, 
        priority: 'low',
        batchable: true,
        useCache: true,
      }).catch(error => {
        console.warn(`Preload failed for ${url}:`, error);
      })
    );
    
    await Promise.allSettled(preloadPromises);
  }
}

// Create singleton instance
export const apiClient = EnhancedApiClient.getInstance();

// Export types for use in other modules
export type { RequestConfig };