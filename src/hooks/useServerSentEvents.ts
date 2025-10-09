import { useEffect, useRef, useState, useCallback } from 'react';
import { BACKEND_BASE_URL } from '@/lib/constants/api';
import { getAuthHeader } from '@/lib/auth/authservice';

export interface SSEEvent {
  type: string;
  data: any;
  timestamp: number;
}

interface UseSSEOptions {
  endpoint: string;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onEvent?: (event: SSEEvent) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseSSEReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastEvent: SSEEvent | null;
  reconnectCount: number;
  connect: () => void;
  disconnect: () => void;
}

export const useServerSentEvents = (options: UseSSEOptions): UseSSEReturn => {
  const {
    endpoint,
    enabled = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onEvent,
    onError,
    onConnect,
    onDisconnect
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting from SSE...');
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
    setReconnectCount(0);
    
    onDisconnect?.();
  }, []); // Remove onDisconnect from deps to prevent circular dependency

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current || isConnecting) {
      return;
    }

    console.log('🔌 Connecting to SSE...', endpoint);
    setIsConnecting(true);
    setError(null);

    try {
      // Create the SSE URL with auth headers as query parameters since EventSource doesn't support custom headers
      const authHeader = getAuthHeader();
      const url = new URL(`${BACKEND_BASE_URL}${endpoint}`);
      
      // Add auth token as query parameter if available
      if (authHeader.Authorization) {
        const token = authHeader.Authorization.replace('Bearer ', '');
        url.searchParams.set('token', token);
      }

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ SSE connection opened');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        setReconnectCount(0);
        onConnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const sseEvent: SSEEvent = {
            type: data.type || 'message',
            data: data,
            timestamp: Date.now()
          };
          
          console.log('📡 SSE event received:', sseEvent);
          setLastEvent(sseEvent);
          onEvent?.(sseEvent);
        } catch (err) {
          console.warn('Failed to parse SSE event data:', err);
        }
      };

      // Handle specific event types
      eventSource.addEventListener('property:created', (event) => {
        try {
          const data = JSON.parse(event.data);
          const sseEvent: SSEEvent = {
            type: 'property:created',
            data: data,
            timestamp: Date.now()
          };
          
          console.log('🏠 New property created:', sseEvent);
          setLastEvent(sseEvent);
          onEvent?.(sseEvent);
        } catch (err) {
          console.warn('Failed to parse property:created event:', err);
        }
      });

      eventSource.addEventListener('property:updated', (event) => {
        try {
          const data = JSON.parse(event.data);
          const sseEvent: SSEEvent = {
            type: 'property:updated',
            data: data,
            timestamp: Date.now()
          };
          
          console.log('🏠 Property updated:', sseEvent);
          setLastEvent(sseEvent);
          onEvent?.(sseEvent);
        } catch (err) {
          console.warn('Failed to parse property:updated event:', err);
        }
      });

      eventSource.addEventListener('property:deleted', (event) => {
        try {
          const data = JSON.parse(event.data);
          const sseEvent: SSEEvent = {
            type: 'property:deleted',
            data: data,
            timestamp: Date.now()
          };
          
          console.log('🏠 Property deleted:', sseEvent);
          setLastEvent(sseEvent);
          onEvent?.(sseEvent);
        } catch (err) {
          console.warn('Failed to parse property:deleted event:', err);
        }
      });

      eventSource.onerror = (event) => {
        console.error('❌ SSE connection error:', event);
        setIsConnected(false);
        setIsConnecting(false);
        
        const errorMsg = 'SSE connection failed';
        setError(errorMsg);
        onError?.(new Error(errorMsg));

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setReconnectCount(reconnectAttemptsRef.current);
          
          console.log(`🔄 Attempting to reconnect in ${reconnectInterval}ms... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            disconnect();
            connect();
          }, reconnectInterval);
        } else {
          console.error('🚨 Max reconnection attempts reached');
          disconnect();
        }
      };

    } catch (err) {
      console.error('Failed to create SSE connection:', err);
      setIsConnecting(false);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      onError?.(err instanceof Error ? err : new Error('Failed to connect'));
    }
  }, [endpoint, enabled, reconnectInterval, maxReconnectAttempts, onEvent, onError, onConnect, isConnecting]); // Remove disconnect from deps

  // Auto-connect when enabled
  useEffect(() => {
    if (enabled && !eventSourceRef.current && !isConnecting) {
      connect();
    } else if (!enabled && eventSourceRef.current) {
      disconnect();
    }
  }, [enabled, isConnecting]); // Remove connect and disconnect from deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Direct cleanup without calling disconnect to avoid dependency issues
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []); // No dependencies needed for cleanup

  return {
    isConnected,
    isConnecting,
    error,
    lastEvent,
    reconnectCount,
    connect,
    disconnect
  };
};

// Specific hook for property updates
export const usePropertySSE = (options?: Omit<UseSSEOptions, 'endpoint'>) => {
  return useServerSentEvents({
    ...options,
    endpoint: '/events/properties'
  });
};