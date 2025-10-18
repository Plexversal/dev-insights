import { useState, useEffect, useCallback, useRef } from 'react';
import { showToast, context } from '@devvit/web/client';
interface NotificationStatus {
  enabled: boolean;
  username: string;
  totalSubscribers: number;
}

export const useNotifications = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial notification status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/notifications/status');
        if (response.ok) {
          const data: NotificationStatus = await response.json();
          setIsEnabled(data.enabled);
          setTotalSubscribers(data.totalSubscribers);
        }
      } catch (error) {
        console.error('Failed to fetch notification status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // Debounced toggle function
  const toggleNotifications = useCallback(async () => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Optimistically update UI
    const newState = !isEnabled;
    setIsEnabled(newState);

    // Debounce the API call
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/notifications/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled: newState }),
        });

        if (response.ok) {
          const data: NotificationStatus = await response.json();
          setIsEnabled(data.enabled);
          setTotalSubscribers(data.totalSubscribers);
          if(data.enabled) {
            showToast(`You will now be notified of new official posts for: ${context.subredditName}. Total Subscribers: ${totalSubscribers}!`)
          } else {
            showToast(`You have now disabled official post notifications for: ${context.subredditName}`)
          }
        } else {
          // Revert on error
          setIsEnabled(!newState);
          console.error('Failed to toggle notifications');
        }
      } catch (error) {
        // Revert on error
        setIsEnabled(!newState);
        showToast('There was an error setting notifications.')
        console.error('Error toggling notifications:', error);
      }
    }, 1000); // 500ms debounce
  }, [isEnabled]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    isEnabled,
    loading,
    totalSubscribers,
    toggleNotifications,
  };
};
