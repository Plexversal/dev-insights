import { Request, Response } from 'express';
import { redis, reddit } from '@devvit/web/server';

interface AnalyticsClick {
  username: string;
  timestamp: number;
}

export const postUserAnalytics = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get current username, default to 'anonymous' if not logged in
    const username = await reddit.getCurrentUsername() ?? 'anonymous';

    console.log(`[Analytics] Recording interaction for user: ${username}`);

    // Get existing analytics from Redis (using v2 key for new structure)
    const analyticsKey = 'app:analytics:v2';
    const existingData = await redis.get(analyticsKey);

    let analytics: AnalyticsClick[] = [];

    if (existingData) {
      try {
        analytics = JSON.parse(existingData);
      } catch (parseError) {
        console.error('[Analytics] Failed to parse existing analytics, starting fresh:', parseError);
        analytics = [];
      }
    }

    // Add new click with timestamp
    const newClick: AnalyticsClick = {
      username,
      timestamp: Date.now()
    };

    analytics.push(newClick);

    // Save updated analytics back to Redis
    await redis.set(analyticsKey, JSON.stringify(analytics));

    console.log(`[Analytics] Recorded click for ${username} at ${new Date(newClick.timestamp).toISOString()}`);

    // Send success response (non-blocking on client)
    res.status(200).json({
      status: 'success',
      message: 'Analytics recorded'
    });

  } catch (error) {
    console.error(`[Analytics] Error recording analytics: ${error}`);
    // Don't fail the request, just log the error
    res.status(200).json({
      status: 'error',
      message: 'Failed to record analytics',
    });
  }
};
