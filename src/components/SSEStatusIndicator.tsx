"use client";
import React from 'react';
import { useGlobalCache } from '@/contexts/GlobalCacheContext';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';

interface SSEStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const SSEStatusIndicator: React.FC<SSEStatusIndicatorProps> = ({ 
  className = '',
  showDetails = false 
}) => {
  const { 
    isSSEConnected, 
    isSSEConnecting, 
    sseError, 
    sseReconnectCount 
  } = useGlobalCache();

  if (!showDetails && isSSEConnected && !sseError) {
    return null; // Don't show anything when everything is working fine
  }

  const getStatusInfo = () => {
    if (isSSEConnecting) {
      return {
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        text: sseReconnectCount > 0 ? `Reconnecting... (${sseReconnectCount})` : 'Connecting...',
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200'
      };
    }

    if (sseError) {
      return {
        icon: <AlertCircle className="w-3 h-3" />,
        text: 'Connection Error',
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200'
      };
    }

    if (isSSEConnected) {
      return {
        icon: <Wifi className="w-3 h-3" />,
        text: 'Live Updates Active',
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200'
      };
    }

    return {
      icon: <WifiOff className="w-3 h-3" />,
      text: 'Offline',
      variant: 'secondary' as const,
      className: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Badge 
      variant={statusInfo.variant}
      className={`flex items-center gap-1 text-xs font-medium ${statusInfo.className} ${className}`}
      title={sseError || 'Real-time property updates status'}
    >
      {statusInfo.icon}
      {showDetails && <span>{statusInfo.text}</span>}
    </Badge>
  );
};

export default SSEStatusIndicator;