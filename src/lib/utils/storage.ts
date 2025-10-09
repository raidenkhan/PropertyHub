// Storage utility for persisting cached data across browser sessions
export interface StoredCacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
  version: string;
}

// Storage configuration
const STORAGE_CONFIG = {
  PREFIX: 'ph_cache_', // PropertyHub cache prefix
  VERSION: '1.0', // Cache version for invalidation
  DEFAULT_EXPIRY: 30 * 60 * 1000, // 30 minutes for localStorage persistence
  COMPRESSED_THRESHOLD: 1024, // Compress data larger than 1KB
  MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB max storage usage
};

export class StorageManager {
  private static instance: StorageManager;
  private compressionAvailable: boolean = false;
  private compressionEnabled: boolean = true;

  constructor() {
    // Check if compression is available
    this.compressionAvailable = typeof CompressionStream !== 'undefined';
    // Disable compression initially for compatibility
    this.compressionEnabled = false;
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // Check if localStorage is available
  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      const test = 'localStorage_test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Get storage key with prefix
  private getStorageKey(key: string): string {
    return `${STORAGE_CONFIG.PREFIX}${key}`;
  }

  // Compress data if available and data is large
  private async compressData(data: string): Promise<string> {
    if (!this.compressionAvailable || !this.compressionEnabled || data.length < STORAGE_CONFIG.COMPRESSED_THRESHOLD) {
      return data;
    }

    try {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      // Write data and close writer
      await writer.write(new TextEncoder().encode(data));
      await writer.close();
      
      // Read all chunks from the compressed stream
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      // Combine all chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      return btoa(String.fromCharCode(...combined));
    } catch {
      return data; // Fallback to uncompressed
    }
  }

  // Decompress data if it was compressed
  private async decompressData(data: string): Promise<string> {
    if (!this.compressionAvailable || !this.compressionEnabled) {
      return data;
    }

    try {
      // Try to detect if data is compressed (base64)
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
        return data; // Not base64, probably not compressed
      }

      const compressedData = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      // Write compressed data and close writer
      await writer.write(compressedData);
      await writer.close();
      
      // Read all chunks from the decompressed stream
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      // Combine all chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      return new TextDecoder().decode(combined);
    } catch {
      return data; // Fallback to original data
    }
  }

  // Store data in localStorage with metadata
  async setItem<T>(key: string, data: T, expiry?: number): Promise<boolean> {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    try {
      const item: StoredCacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: expiry || STORAGE_CONFIG.DEFAULT_EXPIRY,
        version: STORAGE_CONFIG.VERSION,
      };

      const serialized = JSON.stringify(item);
      const compressed = await this.compressData(serialized);
      const storageKey = this.getStorageKey(key);

      // Check storage size limit
      if (this.getStorageSize() + compressed.length > STORAGE_CONFIG.MAX_STORAGE_SIZE) {
        await this.cleanupOldEntries();
      }

      localStorage.setItem(storageKey, compressed);
      return true;
    } catch (error) {
      console.warn('Failed to store item in localStorage:', error);
      return false;
    }
  }

  // Retrieve data from localStorage with validation
  async getItem<T>(key: string): Promise<T | null> {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    try {
      const storageKey = this.getStorageKey(key);
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) {
        return null;
      }

      const decompressed = await this.decompressData(stored);
      const item: StoredCacheItem<T> = JSON.parse(decompressed);

      // Check version compatibility
      if (item.version !== STORAGE_CONFIG.VERSION) {
        this.removeItem(key); // Remove outdated cache
        return null;
      }

      // Check expiry
      if (Date.now() - item.timestamp > item.expiry) {
        this.removeItem(key); // Remove expired cache
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to retrieve item from localStorage:', error);
      this.removeItem(key); // Remove corrupted cache
      return null;
    }
  }

  // Remove item from localStorage
  removeItem(key: string): void {
    if (!this.isLocalStorageAvailable()) return;
    
    const storageKey = this.getStorageKey(key);
    localStorage.removeItem(storageKey);
  }

  // Check if item exists and is valid
  async hasValidItem(key: string): Promise<boolean> {
    const item = await this.getItem(key);
    return item !== null;
  }

  // Get current storage size usage
  getStorageSize(): number {
    if (!this.isLocalStorageAvailable()) return 0;
    
    let total = 0;
    for (const key in localStorage) {
      if (key.startsWith(STORAGE_CONFIG.PREFIX)) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return total;
  }

  // Cleanup old entries to free space
  async cleanupOldEntries(): Promise<void> {
    if (!this.isLocalStorageAvailable()) return;
    
    const entries: Array<{ key: string; timestamp: number }> = [];
    
    // Collect all cache entries with timestamps
    for (const key in localStorage) {
      if (key.startsWith(STORAGE_CONFIG.PREFIX)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const decompressed = await this.decompressData(stored);
            const item: StoredCacheItem<any> = JSON.parse(decompressed);
            entries.push({ key, timestamp: item.timestamp });
          }
        } catch {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    }

    // Sort by timestamp (oldest first) and remove oldest entries
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(entries.length * 0.3); // Remove 30% of entries
    
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i].key);
    }
  }

  // Clear all cache entries
  clearAll(): void {
    if (!this.isLocalStorageAvailable()) return;
    
    const keysToRemove: string[] = [];
    for (const key in localStorage) {
      if (key.startsWith(STORAGE_CONFIG.PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    totalEntries: number;
    storageUsed: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  }> {
    if (!this.isLocalStorageAvailable()) {
      return { totalEntries: 0, storageUsed: 0 };
    }
    
    const entries: number[] = [];
    let totalEntries = 0;
    
    for (const key in localStorage) {
      if (key.startsWith(STORAGE_CONFIG.PREFIX)) {
        totalEntries++;
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const decompressed = await this.decompressData(stored);
            const item: StoredCacheItem<any> = JSON.parse(decompressed);
            entries.push(item.timestamp);
          }
        } catch {
          // Skip corrupted entries
        }
      }
    }
    
    return {
      totalEntries,
      storageUsed: this.getStorageSize(),
      oldestEntry: entries.length ? new Date(Math.min(...entries)) : undefined,
      newestEntry: entries.length ? new Date(Math.max(...entries)) : undefined,
    };
  }

  // Migrate data between versions if needed
  async migrateCache(migrationFn?: (oldData: any) => any): Promise<void> {
    if (!this.isLocalStorageAvailable() || !migrationFn) return;
    
    for (const key in localStorage) {
      if (key.startsWith(STORAGE_CONFIG.PREFIX)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const decompressed = await this.decompressData(stored);
            const item: StoredCacheItem<any> = JSON.parse(decompressed);
            
            if (item.version !== STORAGE_CONFIG.VERSION) {
              const migratedData = migrationFn(item.data);
              const cacheKey = key.replace(STORAGE_CONFIG.PREFIX, '');
              await this.setItem(cacheKey, migratedData, item.expiry);
            }
          }
        } catch {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    }
  }
}

// Create singleton instance
export const storage = StorageManager.getInstance();

// Utility functions for common operations
export const cacheUtils = {
  // Store data with default expiry
  set: <T>(key: string, data: T, expiry?: number) => storage.setItem(key, data, expiry),
  
  // Retrieve data
  get: <T>(key: string) => storage.getItem<T>(key),
  
  // Remove data
  remove: (key: string) => storage.removeItem(key),
  
  // Check if data exists and is valid
  has: (key: string) => storage.hasValidItem(key),
  
  // Clear all cached data
  clear: () => storage.clearAll(),
  
  // Get cache statistics
  stats: () => storage.getCacheStats(),
};