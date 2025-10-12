// hooks/useHostDashboard.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { hostDashboardService,Property } from '@/lib/api/hostDashBoardService';
import { toast } from '@/hooks/use-toast';

// export interface Property {
//   id: number;
//   propertyId: string;
//   title: string;
//   description: string;
//   price: number;
//   type: "SELL" | "RENT" | "LEASE" | "STAY";
//   status: "DRAFT" | "PENDING_VERIFICATION" | "VERIFIED" | "LISTED" | "SOLD" | "REJECTED" | "SUSPENDED";
//   location: string;
//   coordinates?: { lat: number; lng: number };
//   images: string[];
//   amenities: string[];
//   specifications?: Record<string, any>;
//   bedrooms?: number;
//   bathrooms?: number;
//   area?: number;
//   currentOwnerId: number;
//   listedById?: number;
//   isVerified: boolean;
//   verifiedById?: number;
//   verifiedAt?: string;
//   createdAt: string;
//   updatedAt: string;
//   listedAt?: string;
//   soldAt?: string;
//   currentOwner?: { name: string; email: string };
//   listedBy?: { name: string; email: string };
// }

export interface DashboardStats {
  totalProperties: number;
  listedProperties: number;
  soldProperties: number;
  pendingVerification: number;
  draftProperties: number;
  rejectedProperties: number;
  totalInquiries: number;
  unreadMessages: number;
  totalRevenue: number;
  pendingPayouts: number;
}

const CACHE_KEY = 'hostDashboardCache_v1';

export const useHostDashboard = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]); // Store all properties for filtering
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  // Memoize stats calculation to prevent unnecessary recalculations
  const stats = useMemo((): DashboardStats => {
    return {
      totalProperties: allProperties.length,
      listedProperties: allProperties.filter(p => p.status === "LISTED" || p.status === "VERIFIED").length,
      soldProperties: allProperties.filter(p => p.status === "SOLD").length,
      pendingVerification: allProperties.filter(p => p.status === "PENDING_VERIFICATION").length,
      draftProperties: allProperties.filter(p => p.status === "DRAFT").length,
      rejectedProperties: allProperties.filter(p => p.status === "SUSPENDED").length,
      totalInquiries: 0, // This would come from a separate inquiry count API
      unreadMessages: 0, // This would come from messages API
      totalRevenue: 0, // This would come from transactions API
      pendingPayouts: 0, // This would come from transactions API
    };
  }, [allProperties]);

  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      // Fetch all properties using your existing service
      const response = await hostDashboardService.getMyProperties({ limit: 100 });
      
      // Handle different response structures
      const propertiesData = response.data || response.data || response;
      
      // Update both all properties and current filtered properties
      setAllProperties(propertiesData);
      setProperties(propertiesData); // Default to show all initially
      
      // Update cache
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ properties: propertiesData, ts: Date.now() })
          );
        } catch {}
      }

      hasFetchedRef.current = true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Dashboard fetch error:', err);
      
      // Only show toast for non-silent requests
      if (!silent) {
        toast({
          title: "Failed to load dashboard",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []); // Removed calculateStats dependency to prevent infinite re-renders

  // Filter properties by status locally instead of making new API calls
  const filterPropertiesByStatus = useCallback((status: string) => {
    const filtered = allProperties.filter(property => {
      switch (status) {
        case "LISTED":
          return property.status === "LISTED";
        case "VERIFIED":
          return property.status === "VERIFIED";
        case "PENDING_VERIFICATION":
          return property.status === "PENDING_VERIFICATION";
        case "DRAFT":
          return property.status === "DRAFT";
        case "REJECTED":
        case "SUSPENDED":
          return property.status === "SUSPENDED";
        case "SOLD":
          return property.status === "SOLD";
        default:
          return true;
      }
    });
    setProperties(filtered);
    return filtered;
  }, [allProperties]);

  // Keep the API-based fetch for backward compatibility if needed
  const fetchPropertiesByStatus = useCallback(async (status: string, force = false) => {
    // If we have data and not forcing, filter locally instead
    if (hasFetchedRef.current && !force) {
      return filterPropertiesByStatus(status);
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await hostDashboardService.getMyProperties({ status });
      const propertiesData = response.data || response;
      setProperties(propertiesData);
      // Update all properties if this is a more comprehensive dataset
      if (propertiesData.length > allProperties.length) {
        setAllProperties(propertiesData);
      }
      return propertiesData;
    } catch (error) {
      console.error(`Failed to fetch ${status} properties:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load properties';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [allProperties, filterPropertiesByStatus]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      // Hydrate from cache for instant UI on revisit
      if (typeof window !== 'undefined') {
        try {
          const raw = window.sessionStorage.getItem(CACHE_KEY);
          if (raw && isMounted) {
            const cached = JSON.parse(raw) as { properties: Property[]; ts: number };
            if (cached?.properties) {
              setAllProperties(cached.properties);
              setProperties(cached.properties);
              setInitialLoad(false); // Don't show skeleton if we have cached data
              setLoading(false);
              
              // Check if cache is fresh (less than 5 minutes old)
              const isRecentCache = Date.now() - (cached.ts || 0) < 5 * 60 * 1000;
              if (isRecentCache) {
                hasFetchedRef.current = true;
                return; // Skip background refresh for fresh cache
              }
            }
          }
        } catch (e) {
          // ignore cache errors
        }
      }
      
      // Fetch fresh data if no cache or cache is stale
      if (isMounted && !hasFetchedRef.current) {
        await fetchDashboardData();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array prevents re-runs

  const refetch = useCallback((force = false) => {
    hasFetchedRef.current = false; // Reset fetch flag to force refresh
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    properties,
    allProperties,
    stats,
    loading: initialLoad ? loading : false, // Don't show loading for subsequent updates
    initialLoad,
    error,
    refetch,
    fetchPropertiesByStatus,
    filterPropertiesByStatus, // Add the new filter function
  };
};

export const usePropertyActions = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const setActionLoading = (propertyId: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [propertyId]: isLoading }));
  };

  const deleteProperty = async (propertyId: number, onSuccess?: () => void) => {
    const id = propertyId.toString();
    try {
      setActionLoading(id, true);
      
      // Use your existing property service
      await hostDashboardService.deleteProperty(propertyId);
      
      toast({
        title: "Property Deleted",
        description: "Your property has been successfully deleted.",
      });
      
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete property';
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(id, false);
    }
  };

  const updatePropertyStatus = async (
    propertyId: number, 
    newStatus: Property['status'], 
    onSuccess?: (property: Property) => void
  ) => {
    const id = propertyId.toString();
    try {
      setActionLoading(id, true);
      
      // This would depend on your property service having an update method
      const property = await hostDashboardService.updateProperty(propertyId, { status: newStatus });
      
      const actionMessages = {
        'LISTED': 'Property Listed',
        'DRAFT': 'Property Drafted',
        'PENDING_VERIFICATION': 'Submitted for Review',
        'SOLD': 'Property Marked as Sold',
      };

      toast({
        title: 'Property Updated',// actionMessages[newStatus] ||
        description: `Your property status has been updated to ${newStatus.toLowerCase().replace('_', ' ')}.`,
      });
      
      onSuccess?.(property);
      return property;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update property';
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setActionLoading(id, false);
    }
  };

  const listProperty = async (propertyId: number, onSuccess?: (property: Property) => void) => {
    return updatePropertyStatus(propertyId, 'LISTED', onSuccess);
  };

  const delistProperty = async (propertyId: number, onSuccess?: (property: Property) => void) => {
    return updatePropertyStatus(propertyId, 'DRAFT', onSuccess);
  };

  const submitForVerification = async (propertyId: number, onSuccess?: (property: Property) => void) => {
    return updatePropertyStatus(propertyId, 'PENDING_VERIFICATION', onSuccess);
  };

  return {
    deleteProperty,
    listProperty,
    delistProperty,
    submitForVerification,
    updatePropertyStatus,
    loading,
  };
};

// Placeholder hooks for future implementation
export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchTransactions = async (params?: {
    page?: number;
    limit?: number;
    role?: 'buyer' | 'seller' | 'all';
  }) => {
    // TODO: Implement with your transaction API
    console.log('Fetching transactions with params:', params);
  };

  const refetch = (params?: { page?: number; limit?: number; role?: 'buyer' | 'seller' | 'all' }) => {
    fetchTransactions(params);
  };

  return {
    transactions,
    loading,
    error,
    pagination,
    refetch,
  };
};

export const useMessages = () => {
  const [conversations, setConversations] = useState<Array<{
    partner: {
      id: number;
      name: string;
      avatar?: string;
      isActive: boolean;
    };
    lastMessage: any;
    unreadCount: number;
  }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    // TODO: Implement with your messages API
    console.log('Fetching conversations');
  };

  const sendMessage = async (receiverId: number, content: string) => {
    // TODO: Implement with your messages API
    console.log('Sending message:', { receiverId, content });
  };

  const markAsRead = async (otherUserId: number) => {
    // TODO: Implement with your messages API
    console.log('Marking as read for user:', otherUserId);
  };

  const refetch = () => {
    fetchConversations();
  };

  return {
    conversations,
    unreadCount,
    loading,
    error,
    sendMessage,
    markAsRead,
    refetch,
  };
};


