import { useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useToast } from '../context/ToastContext';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const wasOffline = useRef(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      const connected = state.isConnected !== false;
      if (!connected) {
        wasOffline.current = true;
        setIsOnline(false);
        return;
      }
      setIsOnline(online);
      if (online && wasOffline.current) {
        showToast('Back online — syncing your data ✓', 'success');
        wasOffline.current = false;
      }
    });
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected !== false);
    });
    return () => unsub();
  }, [showToast]);

  return isOnline;
}
