import { Request, Response } from 'express';
import { redis } from '@devvit/web/server';

interface AnalyticsClick {
  username: string;
  timestamp: number;
}

interface AnalyticsResponse {
  status: string;
  data?: {
    uniqueUsers?: number;
    totalClicks?: number;
    userClicks?: number;
    username?: string;
    clicks?: AnalyticsClick[];
  };
  message?: string;
}

export const getAnalyticsHandler = async (
  req: Request,
  res: Response<AnalyticsResponse>
): Promise<void> => {
  try {
    const { user, startDate, endDate } = req.query;

    // Get analytics from Redis
    const analyticsKey = 'app:analytics:v2';
    const existingData = await redis.get(analyticsKey);

    if (!existingData) {
      res.json({
        status: 'success',
        data: {
          uniqueUsers: 0,
          totalClicks: 0
        }
      });
      return;
    }

    let allClicks: AnalyticsClick[] = [];
    try {
      allClicks = JSON.parse(existingData);
    } catch (parseError) {
      console.error('[Analytics] Failed to parse analytics data:', parseError);
      res.status(500).json({
        status: 'error',
        message: 'Failed to parse analytics data'
      });
      return;
    }

    // Filter by date range if provided
    let filteredClicks = allClicks;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate as string).getTime() : 0;
      const end = endDate ? new Date(endDate as string).getTime() : Date.now();

      filteredClicks = allClicks.filter(click =>
        click.timestamp >= start && click.timestamp <= end
      );
    }

    // If user parameter provided, return data for that specific user
    if (user) {
      const username = user as string;
      const userClicks = filteredClicks.filter(click => click.username === username);

      res.json({
        status: 'success',
        data: {
          username,
          userClicks: userClicks.length,
          clicks: userClicks
        }
      });
      return;
    }

    // Otherwise, return aggregate data
    const uniqueUsers = new Set(filteredClicks.map(click => click.username)).size;
    const totalClicks = filteredClicks.length;

    res.json({
      status: 'success',
      data: {
        uniqueUsers,
        totalClicks
      }
    });

  } catch (error) {
    console.error('[Analytics] Error fetching analytics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics'
    });
  }
};
