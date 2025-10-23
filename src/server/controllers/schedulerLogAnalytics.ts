import { Request, Response } from 'express';
import { redis } from '@devvit/web/server';
import { sendDiscordLogs } from '../lib/sendDiscordLogs';

interface AnalyticsClick {
  username: string;
  timestamp: number;
}

export const schedulerLogAnalytics = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const now = new Date().toISOString();
    // console.log(`[Scheduler] Running analytics log at ${now}`);

    // Get analytics from Redis
    const analyticsKey = 'app:analytics:v2';
    const existingData = await redis.get(analyticsKey);

    if (!existingData) {
      // console.log('[Scheduler] No analytics data found');
      res.status(200).json({ status: 'ok', message: 'No analytics data' });
      return;
    }

    let allClicks: AnalyticsClick[] = [];
    try {
      allClicks = JSON.parse(existingData);
    } catch (parseError) {
      console.error('[Scheduler] Failed to parse analytics data:', parseError);
      res.status(200).json({ status: 'ok', message: 'Failed to parse data' });
      return;
    }

    // Calculate statistics
    const uniqueUsers = new Set(allClicks.map(click => click.username)).size;
    const totalClicks = allClicks.length;

    // Count clicks per user
    const userClickCounts: Record<string, number> = {};
    allClicks.forEach(click => {
      userClickCounts[click.username] = (userClickCounts[click.username] || 0) + 1;
    });

    // Find top users
    const topUsers = Object.entries(userClickCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([username, clicks]) => ({ username, clicks }));

    // Log the statistics
    const topUsersList = topUsers.map((user, index) =>
      `   ${index + 1}. ${user.username}: ${user.clicks} clicks`
    ).join('\n');

    console.log(
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `[Analytics Report] ${now}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 Total Unique Users: ${uniqueUsers}\n` +
      `🖱️  Total Clicks: ${totalClicks}\n` +
      `📈 Average Clicks per User: ${(totalClicks / uniqueUsers).toFixed(2)}\n\n` +
      `🏆 Top 5 Most Active Users:\n${topUsersList}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    );

    // Send logs to Discord
    try {
      await sendDiscordLogs();
      console.log('[Scheduler] Discord logs sent successfully');
    } catch (discordError) {
      console.error('[Scheduler] Failed to send Discord logs:', discordError);
      // Don't fail the entire scheduler job if Discord fails
    }

    res.status(200).json({
      status: 'ok',
      data: {
        timestamp: now,
        uniqueUsers,
        totalClicks,
        topUsers
      }
    });

  } catch (error) {
    console.error('[Scheduler] Error logging analytics:', error);
    res.status(200).json({ status: 'ok', message: 'Error occurred' });
  }
};
