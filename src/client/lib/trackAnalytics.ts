/**
 * Track user interaction analytics
 * Fires a non-blocking request to the analytics endpoint
 */
export const trackAnalytics = (): void => {
  // Fire and forget - don't wait for response
  fetch('/api/analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }).catch(error => {
    // Silently fail - we don't want analytics to break user experience
    console.debug('[Analytics] Failed to track interaction:', error);
  });
};
