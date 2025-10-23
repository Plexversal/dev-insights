import { redis, context, settings, reddit, Post } from '@devvit/web/server';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1430591463854444626/Neeh_e4Pa9MNkB9PaB_xSUqnsSMADIyHstgU7vng0EO1WkUHBYKn-FDwqlIK4-DZRVix';

interface AnalyticsClick {
  username: string;
  timestamp: number;
}

interface ModLogs {
  userReportReasons?: string[];
  removedBy?: string;
  stickied?: boolean;
}

export const sendDiscordLogs = async (): Promise<void> => {
  try {
    const subname = context.subredditName;
    const timestamp = new Date().toISOString();

    // Fetch latest app post ID for this subreddit
    let latestAppPostId: string | null = null;
    try {
      const appPostsListing = await reddit.getPostsByUser({
        username: context.appName,
        limit: 100,
        pageSize: 100,
      });
        const appPosts = (await appPostsListing.all()) ?? [];
        const subredditAppPosts = (appPosts!).filter(
          (p: Post) => p.subredditName === context.subredditName
        );
        if (subredditAppPosts.length === 0) return;
        latestAppPostId = subredditAppPosts[0]!.id;
    } catch (err) {
      console.error('[Discord Logs] Failed to fetch app posts, returning early:', err);
      return;
    }

    // Fetch unique users from analytics
    const analyticsKey = 'app:analytics:v2';
    const existingData = await redis.get(analyticsKey);
    let uniqueUsers = 0;
    let totalClicks = 0;
    let avgClicksPerUser = 0;
    let topUsersDisplay = 'No data';

    if (existingData) {
      try {
        const allClicks: AnalyticsClick[] = JSON.parse(existingData);
        uniqueUsers = new Set(allClicks.map(click => click.username)).size;
        totalClicks = allClicks.length;
        avgClicksPerUser = uniqueUsers > 0 ? totalClicks / uniqueUsers : 0;

        // Count clicks per user
        const userClickCounts: Record<string, number> = {};
        allClicks.forEach(click => {
          userClickCounts[click.username] = (userClickCounts[click.username] || 0) + 1;
        });

        // Find top 5 users
        const topUsers = Object.entries(userClickCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([username, clicks]) => ({ username, clicks }));

        topUsersDisplay = topUsers.length > 0
          ? topUsers.map((user, index) => `${index + 1}. ${user.username}: ${user.clicks} clicks`).join('\n')
          : 'No users yet';
      } catch (parseError) {
        console.error('[Discord Logs] Failed to parse analytics data:', parseError);
      }
    }

    // Fetch first 25 post IDs
    const posts = await redis.zRange('global_posts', 0, 24, {
      by: 'rank',
      reverse: true
    });
    const postIds = posts.map((p: any) => p.member);
    const postIdsString = postIds.length > 0
      ? postIds.join(', ')
      : 'No posts yet';

    // Fetch first 25 comment IDs
    const comments = await redis.zRange('global_comments', 0, 24, {
      by: 'rank',
      reverse: true
    });
    const commentIds = comments.map((c: any) => c.member);
    const commentIdsString = commentIds.length > 0
      ? commentIds.join(', ')
      : 'No comments yet';

    // Fetch all settings
    const results = await Promise.allSettled([
      settings.get('postTitle'),
      settings.get('postsButtonName'),
      settings.get('commentsButtonName'),
      settings.get('bottomSubtitle'),
      settings.get('subredditUsers'),
      settings.get('subredditFlairText'),
      settings.get('subredditFlairCssclass'),
      reddit.getPostById(latestAppPostId as `t3_${string}`).then(p => ({
        userReportReasons: p.userReportReasons,
        removedBy: p.removedBy,
        stickied: p.stickied
      }))
    ]);

    const [
      postTitle,
      postsButtonName,
      commentsButtonName,
      bottomSubtitle,
      subredditUsers,
      subredditFlairText,
      subredditFlairCssclass,
      appModLogsResult
    ] = results.map(r => (r.status === 'fulfilled' ? r.value : null));

    // Type-guard for mod logs
    const appModLogs: ModLogs | null =
      appModLogsResult &&
      typeof appModLogsResult === 'object' &&
      'removedBy' in appModLogsResult
        ? appModLogsResult as ModLogs
        : null;

    // Format settings for display
    const settingsDisplay = [
      `**Post Title:** ${postTitle || 'Not set'}`,
      `**Posts Button Name:** ${postsButtonName || 'Announcements (default)'}`,
      `**Comments Button Name:** ${commentsButtonName || 'Official Replies (default)'}`,
      `**Bottom Subtitle:** ${bottomSubtitle || 'Official Replies (default)'}`,
      `**Subreddit Users:** ${subredditUsers || 'None'}`,
      `**Flair Text:** ${subredditFlairText || 'None'}`,
      `**Flair CSS Class:** ${subredditFlairCssclass || 'None'}`
    ].join('\n');
    

    const modLogsDisplay = appModLogs
  ? [
      `**Latest Post Link: https://reddit.com/r/${context.subredditName}/comments/${latestAppPostId}**`,
      `**Removed By:** ${appModLogs.removedBy || 'Unknown'}`,
      `**Pinned:** ${appModLogs.stickied ? 'Yes' : 'No'}`,
      `**User Report Reasons:** ${
        appModLogs.userReportReasons?.length
          ? appModLogs.userReportReasons.join(', ')
          : 'None'
      }`
    ].join('\n')
  : 'No mod logs available';

    // Format analytics display
    const analyticsDisplay = [
      `**Total Unique Users:** ${uniqueUsers}`,
      `**Total Clicks:** ${totalClicks}`,
      `**Average Clicks per User:** ${avgClicksPerUser.toFixed(2)}`,
      `\n**Top 5 Most Active Users:**\n${topUsersDisplay}`
    ].join('\n');

    // Prepare Discord webhook payload
    const webhookPayload = {
      username: 'Dev-insights logs',
      embeds: [{
        title: `Devvit logs: r/${subname} time: ${timestamp}`,
        description: `Devvit logs: ${subname} time: ${timestamp}`,
        color: 15105570,
        fields: [
          {
            name: 'Analytics Summary',
            value: analyticsDisplay.length > 1024
              ? analyticsDisplay.substring(0, 1021) + '...'
              : analyticsDisplay
          },
          {
            name: 'First 25 post IDs',
            value: postIdsString.length > 1024
              ? postIdsString.substring(0, 1021) + '...'
              : postIdsString
          },
          {
            name: 'First 25 comment IDs',
            value: commentIdsString.length > 1024
              ? commentIdsString.substring(0, 1021) + '...'
              : commentIdsString
          },
          {
            name: 'Current settings for subreddit',
            value: settingsDisplay.length > 1024
              ? settingsDisplay.substring(0, 1021) + '...'
              : settingsDisplay
          },
          {
            name: 'Moderation Logs',
            value: modLogsDisplay.length > 1024
              ? modLogsDisplay.substring(0, 1021) + '...'
              : modLogsDisplay
          }
        ]
      }]
    };


    // Send to Discord webhook
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord webhook failed: ${response.status} ${errorText}`);
    }

    console.log('[Discord Logs] Successfully sent logs to Discord');

  } catch (error) {
    console.error('[Discord Logs] Error sending logs to Discord:', error);
    throw error;
  }
};
