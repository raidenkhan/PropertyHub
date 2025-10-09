"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { propertyService } from '@/lib/api/propertyService';
import { cacheUtils } from '@/lib/utils/storage';
import { Property, RawProperty } from '@/types/property';
import { convertPropertyData, ensurePropertyFormat } from '@/lib/utils';

// Types

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
  loading?: boolean;
}

interface GlobalCacheContextType {
  // Properties data
  allProperties: Property[];
  myProperties: Property[];
  
  // Loading states
  allPropertiesLoading: boolean;
  myPropertiesLoading: boolean;
  
  // Methods
  fetchAllProperties: (force?: boolean) => Promise<void>;
  fetchMyProperties: (force?: boolean) => Promise<void>;
  getPropertyById: (id: string) => Property | undefined;
  updateProperty: (id: string, updatedProperty: Partial<Property>) => void;
  invalidateCache: (keys?: string[]) => void;
  
  // Cache utilities
  getCacheAge: (key: string) => number | null;
}

const GlobalCacheContext = createContext<GlobalCacheContextType | undefined>(undefined);

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_EXPIRY: 10 * 60 * 1000, // 10 minutes
  LONG_EXPIRY: 10 * 60 * 1000, // 10 minutes (reduced from 30 minutes)
};

export function GlobalCacheProvider({ children }: { children: ReactNode }) {
  // Cache state
  const [cache, setCache] = useState<Record<string, CacheItem<any>>>({});
  
  // Loading states
  const [allPropertiesLoading, setAllPropertiesLoading] = useState(false);
  const [myPropertiesLoading, setMyPropertiesLoading] = useState(false);
  
  
  // Extracted data from cache with proper formatting
  const allProperties: Property[] = cache.allProperties?.data 
    ? cache.allProperties.data.map((prop: any) => ensurePropertyFormat(prop))
    : [];
  const myProperties: Property[] = cache.myProperties?.data
    ? cache.myProperties.data.map((prop: any) => ensurePropertyFormat(prop))
    : [];

  // Load cache from localStorage on mount
  const loadFromStorage = useCallback(async (key: string): Promise<any> => {
    try {
      const stored = await cacheUtils.get(`global_${key}`);
      if (stored) {
        // Ensure proper formatting for property data
        let formattedData = stored;
        if (key === 'allProperties' || key === 'myProperties') {
          formattedData = Array.isArray(stored) 
            ? stored.map(prop => ensurePropertyFormat(prop))
            : stored;
         // console.log(`🔧 Applied formatting to ${key}:`, formattedData.length, 'properties');
        }
        
        setCache(prev => ({
          ...prev,
          [key]: {
            data: formattedData,
            timestamp: Date.now(),
            expiry: CACHE_CONFIG.DEFAULT_EXPIRY,
            loading: false,
          }
        }));
        return formattedData;
      }
      return stored;
    } catch (error) {
      console.warn(`Failed to load ${key} from storage:`, error);
      return null;
    }
  }, []);

  // Check if cache is valid
  const isCacheValid = useCallback(async (key: string, customExpiry?: number): Promise<boolean> => {
    const item = cache[key];
    
    // Check memory cache first
    if (item) {
      const expiry = customExpiry || item.expiry || CACHE_CONFIG.DEFAULT_EXPIRY;
      return Date.now() - item.timestamp < expiry;
    }
    
    // Check localStorage if not in memory
    const stored = await cacheUtils.has(`global_${key}`);
    if (stored) {
      await loadFromStorage(key);
      return true;
    }
    
    return false;
  }, [cache, loadFromStorage]);

  // Set cache data with localStorage persistence
  const setCacheData = useCallback(async (key: string, data: any, expiry?: number) => {
    const cacheExpiry = expiry || CACHE_CONFIG.DEFAULT_EXPIRY;
    
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now(),
        expiry: cacheExpiry,
        loading: false,
      }
    }));

    // Persist to localStorage asynchronously
    try {
      await cacheUtils.set(`global_${key}`, data, cacheExpiry);
    } catch (error) {
      console.warn('Failed to persist cache to localStorage:', error);
    }
  }, []);

  // Fetch all properties with caching
  const fetchAllProperties = useCallback(async (force = false): Promise<void> => {
    if (!force && await isCacheValid('allProperties', CACHE_CONFIG.LONG_EXPIRY)) {
      return; // Return cached data
    }

    if (cache.allProperties?.loading) {
      return; // Prevent duplicate requests
    }

    setAllPropertiesLoading(true);
    setCache(prev => ({
      ...prev,
      allProperties: { ...prev.allProperties, loading: true }
    }));

    try {
      const response = await propertyService.getAllProperties();
      const rawPropertiesData: RawProperty[] = response?.data || [];
      
      // Convert raw property data to frontend format
      const { allProperties: convertedProperties } = convertPropertyData(rawPropertiesData);
      
      await setCacheData('allProperties', convertedProperties, CACHE_CONFIG.LONG_EXPIRY);
      console.log('✅ All properties converted and cached successfully');
    } catch (error) {
      console.error('Failed to fetch all properties:', error);
      // Keep existing cache if available
      if (!cache.allProperties) {
        await setCacheData('allProperties', []);
      }
    } finally {
      setAllPropertiesLoading(false);
      setCache(prev => ({
        ...prev,
        allProperties: { ...prev.allProperties, loading: false }
      }));
    }
  }, [cache, isCacheValid, setCacheData]);

  // Fetch user's properties with caching
  const fetchMyProperties = useCallback(async (force = false): Promise<void> => {
    if (!force && await isCacheValid('myProperties')) {
      return;
    }

    if (cache.myProperties?.loading) {
      return;
    }

    setMyPropertiesLoading(true);
    setCache(prev => ({
      ...prev,
      myProperties: { ...prev.myProperties, loading: true }
    }));

    try {
      const response = await propertyService.getMyProperties();
      const rawPropertiesData: RawProperty[] = response?.data || [];
      
      // Convert raw property data to frontend format
      const { allProperties: convertedProperties } = convertPropertyData(rawPropertiesData);
      
      await setCacheData('myProperties', convertedProperties, CACHE_CONFIG.DEFAULT_EXPIRY);
      console.log('✅ My properties converted and cached successfully');
    } catch (error) {
      console.error('Failed to fetch my properties:', error);
      if (!cache.myProperties) {
        await setCacheData('myProperties', []);
      }
    } finally {
      setMyPropertiesLoading(false);
      setCache(prev => ({
        ...prev,
        myProperties: { ...prev.myProperties, loading: false }
      }));
    }
  }, [cache, isCacheValid, setCacheData]);

  // Get property by ID from cache
  const getPropertyById = useCallback((id: string): Property | undefined => {
    // First try to find in all properties
    let property = allProperties.find(p => p.id === id);
    
    // If not found, try my properties
    if (!property) {
      property = myProperties.find(p => p.id === id);
    }
    
    return property;
  }, [allProperties, myProperties]);

  // Update property in cache
  const updateProperty = useCallback((id: string, updatedProperty: Partial<Property>) => {
    setCache(prev => {
      const newCache = { ...prev };
      
      // Update in allProperties if it exists there
      if (newCache.allProperties?.data) {
        newCache.allProperties = {
          ...newCache.allProperties,
          data: newCache.allProperties.data.map((property: Property) =>
            property.id === id ? { ...property, ...updatedProperty } : property
          )
        };
      }
      
      // Update in myProperties if it exists there
      if (newCache.myProperties?.data) {
        newCache.myProperties = {
          ...newCache.myProperties,
          data: newCache.myProperties.data.map((property: Property) =>
            property.id === id ? { ...property, ...updatedProperty } : property
          )
        };
      }
      
      return newCache;
    });
  }, []);


  // Invalidate specific cache keys or all
  const invalidateCache = useCallback((keys?: string[]) => {
    if (!keys) {
      setCache({});
      cacheUtils.clear(); // Clear all localStorage
      console.log('🗑️ All cache cleared');
      return;
    }
    
    setCache(prev => {
      const newCache = { ...prev };
      keys.forEach(key => {
        delete newCache[key];
        cacheUtils.remove(`global_${key}`); // Remove from localStorage
        console.log(`🗑️ Cache cleared for: ${key}`);
      });
      return newCache;
    });
  }, []);

  // Get cache age in milliseconds
  const getCacheAge = useCallback((key: string): number | null => {
    const item = cache[key];
    if (!item) return null;
    
    return Date.now() - item.timestamp;
  }, [cache]);

  // Load initial cache from localStorage
  useEffect(() => {
    const initializeCache = async () => {
      try {
        await Promise.allSettled([
          loadFromStorage('allProperties'),
          loadFromStorage('myProperties'),
        ]);
        console.log('📦 Cache initialized from localStorage');
      } catch (error) {
        console.warn('Failed to initialize cache:', error);
      }
    };

    initializeCache();
  }, [loadFromStorage]);

  // Cleanup expired cache entries periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setCache(prev => {
        const now = Date.now();
        const cleaned: Record<string, CacheItem<any>> = {};
        
        Object.entries(prev).forEach(([key, item]) => {
          const expiry = item.expiry || CACHE_CONFIG.DEFAULT_EXPIRY;
          if (now - item.timestamp < expiry * 2) { // Keep for twice the expiry time
            cleaned[key] = item;
          } else {
            console.log(`🧹 Expired cache entry removed: ${key}`);
          }
        });
        
        return cleaned;
      });
    }, CACHE_CONFIG.DEFAULT_EXPIRY);

    return () => clearInterval(cleanupInterval);
  }, []);

  const value: GlobalCacheContextType = {
    // Data
    allProperties,
    myProperties,
    
    // Loading states
    allPropertiesLoading,
    myPropertiesLoading,
    
    // Methods
    fetchAllProperties,
    fetchMyProperties,
    getPropertyById,
    updateProperty,
    invalidateCache,
    getCacheAge,
  };

  return (
    <GlobalCacheContext.Provider value={value}>
      {children}
    </GlobalCacheContext.Provider>
  );
}

export const useGlobalCache = (): GlobalCacheContextType => {
  const context = useContext(GlobalCacheContext);
  if (!context) {
    throw new Error('useGlobalCache must be used within GlobalCacheProvider');
  }
  return context;
};