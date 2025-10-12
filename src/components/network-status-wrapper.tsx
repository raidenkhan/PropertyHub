import { useNetworkStatus } from '@/hooks/use-network-status';
import OfflinePage from '@/app/offline/page';

interface NetworkStatusWrapperProps {
  children: React.ReactNode;
}

export function NetworkStatusWrapper({ children }: NetworkStatusWrapperProps) {
  const isOnline = useNetworkStatus();

  if (!isOnline) {
    return <OfflinePage />;
  }

  return <>{children}</>;
}