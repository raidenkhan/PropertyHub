"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { propertyService } from '@/lib/api/propertyService';
import { transactionService } from '@/lib/api/transactionService';
import { messagesService } from '@/lib/api/messageService';
import { notificationService } from '@/lib/api/notificationService';
import { cacheUtils } from '@/lib/utils/storage';
import { Property } from '@/types/property';

// Types

interface DashboardTransaction {
  id: number;
  amount: number;
  status: string;
  property: { title: string; location: string };
  createdAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  property?: { title: string };
  transaction?: { amount: number };
  dispute?: { title: string };
}

// Cache item with timestamp and expiry
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry?: number;
  loading?: boolean;
}

// Dashboard stats type
interface DashboardStats {
  totalListings: number;
  activePurchases: number;
  unreadMessages: number;
  unreadNotifications: number;
}

interface DataCacheContextType {
  // Data
  properties: Property[];
  transactions: DashboardTransaction[];
  conversations: User[];
  notifications: Notification[];
  stats: DashboardStats;
  
  // Loading states
  isLoading: boolean;
  propertiesLoading: boolean;
  transactionsLoading: boolean;
  conversationsLoading: boolean;
  notificationsLoading: boolean;
  
  // Methods
  fetchAllData: () => Promise<void>;
  fetchProperties: (force?: boolean) => Promise<void>;
  fetchTransactions: (force?: boolean) => Promise<void>;
  fetchConversations: (force?: boolean) => Promise<void>;
  fetchNotifications: (force?: boolean) => Promise<void>;
  invalidateCache: (keys?: string[]) => void;
  prefetchData: (keys: string[]) => Promise<void>;
  
  // Cache utilities
  getCacheStatus: () => Record<string, { age: number; expired: boolean }>;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_EXPIRY: 5 * 60 * 1000, // 5 minutes
  SHORT_EXPIRY: 2 * 60 * 1000, // 2 minutes
  LONG_EXPIRY: 15 * 60 * 1000, // 15 minutes
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

export function DataCacheProvider({ children }: { children: ReactNode }) {
  // Cache state
  const [cache, setCache] = useState<Record<string, CacheItem<any>>>({});
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  
  // Extracted data from cache
  const properties: Property[] = cache.properties?.data || [];
  const transactions: DashboardTransaction[] = cache.transactions?.data || [];
  const conversations: User[] = cache.conversations?.data || [];
  const notifications: Notification[] = cache.notifications?.data || [];
  
  // Calculate stats on-demand instead of caching to avoid infinite loops
  const stats: DashboardStats = useMemo(() => {
    const unreadMessageCount = cache.unreadMessageCount?.data || 0;
    const unreadNotificationCount = notifications.filter(n => !n.read).length;
    const activePurchases = transactions.filter(tx => 
      tx.status === 'PENDING' || tx.status === 'ESCROW'
    ).length;

    return {
      totalListings: properties.length,
      activePurchases,
      unreadMessages: unreadMessageCount,
      unreadNotifications: unreadNotificationCount,
    };
  }, [properties.length, transactions, notifications, cache.unreadMessageCount?.data]);

  // Load cache from localStorage
  const loadFromStorage = useCallback(async (key: string): Promise<any> => {
    try {
      const stored = await cacheUtils.get(`cache_${key}`);
      if (stored) {
        setCache(prev => ({
          ...prev,
          [key]: {
            data: stored,
            timestamp: Date.now(),
            expiry: CACHE_CONFIG.DEFAULT_EXPIRY,
            loading: false,
          }
        }));
      }
      return stored;
    } catch (error) {
      console.warn(`Failed to load ${key} from storage:`, error);
      return null;
    }
  }, []);

  // Utility function to check if cache is valid
  const isCacheValid = useCallback(async (key: string, customExpiry?: number): Promise<boolean> => {
    const item = cache[key];
    
    // Check memory cache first
    if (item) {
      const expiry = customExpiry || item.expiry || CACHE_CONFIG.DEFAULT_EXPIRY;
      return Date.now() - item.timestamp < expiry;
    }
    
    // Check localStorage if not in memory
    const stored = await cacheUtils.has(`cache_${key}`);
    if (stored) {
      await loadFromStorage(key);
      return true;
    }
    
    return false;
  }, [cache, loadFromStorage]);

  // Utility function to set cache with automatic cleanup and localStorage persistence
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
      await cacheUtils.set(`cache_${key}`, data, cacheExpiry);
    } catch (error) {
      console.warn('Failed to persist cache to localStorage:', error);
    }
  }, []);

  // Utility function to set loading state
  const setCacheLoading = useCallback((key: string, loading: boolean) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        loading,
      }
    }));
  }, []);

  // Retry mechanism for failed requests
  const withRetry = useCallback(async (operation: () => Promise<any>, retries = CACHE_CONFIG.MAX_RETRIES): Promise<any> => {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, CACHE_CONFIG.RETRY_DELAY));
        return withRetry(operation, retries - 1);
      }
      throw error;
    }
  }, []);

  // Fetch properties with caching
  const fetchProperties = useCallback(async (force = false): Promise<void> => {
    if (!force && await isCacheValid('properties')) {
      return; // Return cached data
    }

    if (cache.properties?.loading) {
      return; // Prevent duplicate requests
    }

    setPropertiesLoading(true);
    setCacheLoading('properties', true);

    try {
      const response = await withRetry(() => propertyService.getMyProperties());
      const propertiesData = response?.data || [];
      
      await setCacheData('properties', propertiesData, CACHE_CONFIG.DEFAULT_EXPIRY);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      // Keep existing cache if available
      if (!cache.properties) {
        await setCacheData('properties', []);
      }
    } finally {
      setPropertiesLoading(false);
      setCacheLoading('properties', false);
    }
  }, [cache, isCacheValid, withRetry, setCacheData, setCacheLoading]);

  // Fetch transactions with caching
  const fetchTransactions = useCallback(async (force = false): Promise<void> => {
    if (!force && await isCacheValid('transactions')) {
      return;
    }

    if (cache.transactions?.loading) {
      return;
    }

    setTransactionsLoading(true);
    setCacheLoading('transactions', true);

    try {
      const response = await withRetry(() => transactionService.getTransactionHistory());
      const transactionsData = Array.isArray(response?.data) ? response.data : [];
      
      const dashboardTransactions: DashboardTransaction[] = transactionsData.map((tx: any) => ({
        id: tx.id,
        amount: tx.amount,
        status: tx.status,
        property: {
          title: tx.property.title,
          location: tx.property.location
        },
        createdAt: tx.createdAt.toString()
      }));
      
      await setCacheData('transactions', dashboardTransactions, CACHE_CONFIG.SHORT_EXPIRY);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      if (!cache.transactions) {
        await setCacheData('transactions', []);
      }
    } finally {
      setTransactionsLoading(false);
      setCacheLoading('transactions', false);
    }
  }, [cache, isCacheValid, withRetry, setCacheData, setCacheLoading]);

  // Fetch conversations with caching
  const fetchConversations = useCallback(async (force = false): Promise<void> => {
    if (!force && await isCacheValid('conversations')) {
      return;
    }

    if (cache.conversations?.loading) {
      return;
    }

    setConversationsLoading(true);
    setCacheLoading('conversations', true);

    try {
      const conversationsData = await withRetry(() => messagesService.getConversations());
      await setCacheData('conversations', conversationsData || [], CACHE_CONFIG.DEFAULT_EXPIRY);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      if (!cache.conversations) {
        await setCacheData('conversations', []);
      }
    } finally {
      setConversationsLoading(false);
      setCacheLoading('conversations', false);
    }
  }, [cache, isCacheValid, withRetry, setCacheData, setCacheLoading]);

  // Fetch notifications with caching
  const fetchNotifications = useCallback(async (force = false): Promise<void> => {
    if (!force && await isCacheValid('notifications')) {
      return;
    }

    if (cache.notifications?.loading) {
      return;
    }

    setNotificationsLoading(true);
    setCacheLoading('notifications', true);

    try {
      const notificationsData = await withRetry(() => notificationService.getNotifications());
      await setCacheData('notifications', notificationsData?.data || [], CACHE_CONFIG.SHORT_EXPIRY);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      if (!cache.notifications) {
        await setCacheData('notifications', []);
      }
    } finally {
      setNotificationsLoading(false);
      setCacheLoading('notifications', false);
    }
  }, [cache, isCacheValid, withRetry, setCacheData, setCacheLoading]);


  // Fetch unread message count
  const fetchUnreadMessageCount = useCallback(async (force = false) => {
    if (!force && await isCacheValid('unreadMessageCount')) {
      return;
    }

    try {
      const count = await withRetry(() => messagesService.getUnreadMessageCount());
      await setCacheData('unreadMessageCount', count, CACHE_CONFIG.SHORT_EXPIRY);
    } catch (error) {
      console.error('Failed to fetch unread message count:', error);
      await setCacheData('unreadMessageCount', 0);
    }
  }, [isCacheValid, withRetry, setCacheData]);

  // Fetch all essential data
  const fetchAllData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Fetch critical data first (properties for immediate display)
      await fetchProperties();
      
      // Fetch remaining data in background
      const backgroundTasks = [
        fetchTransactions(),
        fetchConversations(),
        fetchNotifications(),
        fetchUnreadMessageCount(),
      ];
      
      await Promise.allSettled(backgroundTasks);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProperties, fetchTransactions, fetchConversations, fetchNotifications, fetchUnreadMessageCount]);

  // Prefetch specific data types
  const prefetchData = useCallback(async (keys: string[]): Promise<void> => {
    const tasks: Promise<void>[] = [];
    
    if (keys.includes('properties') && !(await isCacheValid('properties'))) {
      tasks.push(fetchProperties());
    }
    if (keys.includes('transactions') && !(await isCacheValid('transactions'))) {
      tasks.push(fetchTransactions());
    }
    if (keys.includes('conversations') && !(await isCacheValid('conversations'))) {
      tasks.push(fetchConversations());
    }
    if (keys.includes('notifications') && !(await isCacheValid('notifications'))) {
      tasks.push(fetchNotifications());
    }
    
    await Promise.allSettled(tasks);
  }, [isCacheValid, fetchProperties, fetchTransactions, fetchConversations, fetchNotifications]);

  // Invalidate specific cache keys or all
  const invalidateCache = useCallback((keys?: string[]) => {
    if (!keys) {
      setCache({});
      cacheUtils.clear(); // Clear all localStorage
      return;
    }
    
    setCache(prev => {
      const newCache = { ...prev };
      keys.forEach(key => {
        delete newCache[key];
        cacheUtils.remove(`cache_${key}`); // Remove from localStorage
      });
      return newCache;
    });
  }, []);

  // Get cache status for debugging
  const getCacheStatus = useCallback(() => {
    const status: Record<string, { age: number; expired: boolean }> = {};
    
    Object.entries(cache).forEach(([key, item]) => {
      const age = Date.now() - item.timestamp;
      const expiry = item.expiry || CACHE_CONFIG.DEFAULT_EXPIRY;
      status[key] = {
        age,
        expired: age > expiry,
      };
    });
    
    return status;
  }, [cache]);

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
          }
        });
        
        return cleaned;
      });
    }, CACHE_CONFIG.DEFAULT_EXPIRY);

    return () => clearInterval(cleanupInterval);
  }, []);

  const value: DataCacheContextType = {
    // Data
    properties,
    transactions,
    conversations,
    notifications,
    stats,
    
    // Loading states
    isLoading,
    propertiesLoading,
    transactionsLoading,
    conversationsLoading,
    notificationsLoading,
    
    // Methods
    fetchAllData,
    fetchProperties,
    fetchTransactions,
    fetchConversations,
    fetchNotifications,
    invalidateCache,
    prefetchData,
    getCacheStatus,
  };

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
}

export const useDataCache = (): DataCacheContextType => {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within DataCacheProvider');
  }
  return context;
};