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
    const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');

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

    // Calculate today's UTC midnight boundaries
    const now = new Date();
    const todayStartUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayEndUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const startTimestamp = todayStartUTC.getTime();
    const endTimestamp = todayEndUTC.getTime();

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

        // Filter clicks to only today (UTC midnight to midnight)
        const todaysClicks = allClicks.filter(click =>
          click.timestamp >= startTimestamp && click.timestamp <= endTimestamp
        );

        uniqueUsers = new Set(todaysClicks.map(click => click.username)).size;
        totalClicks = todaysClicks.length;
        avgClicksPerUser = uniqueUsers > 0 ? totalClicks / uniqueUsers : 0;

        // Count clicks per user
        const userClickCounts: Record<string, number> = {};
        todaysClicks.forEach(click => {
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
      settings.get('subredditPostFlairText'),
      settings.get('dependantFlairMatches'),
      settings.get('separateTabPostFlair1'),
      settings.get('disableComments'),
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
      subredditPostFlairText,
      dependantFlairMatches,
      separateTabPostFlair1,
      disableComments,
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
      `**Post Title:** \`${postTitle || 'Not set'}\``,
      `**Posts Button Name:** \`${postsButtonName || 'Announcements (default)'}\``,
      `**Comments Button Name:** \`${commentsButtonName || 'Official Replies (default)'}\``,
      `**Bottom Subtitle:** \`${bottomSubtitle || 'Recent Announcements (default)'}\``,
      `**Disable Comments:** \`${disableComments}\``,
      `**Subreddit Users:** \`${subredditUsers || 'None'}\``,
      `**User Flair Text:** \`${subredditFlairText || 'None'}\``,
      `**User Flair CSS Class:** \`${subredditFlairCssclass || 'None'}\``,
      `**Post Flair Text/ID:** \`${subredditPostFlairText || 'None'}\``,
      `**Post Flair Depends on User:** \`${dependantFlairMatches}\``,
      `**Separate Tab Post Flair:** \`${separateTabPostFlair1 || 'None'}\``
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
      `**Today's Unique Users (UTC):** ${uniqueUsers}`,
      `**Today's Total Clicks (UTC):** ${totalClicks}`,
      `**Average Clicks per User:** ${avgClicksPerUser.toFixed(2)}`,
      `\n**Top 5 Most Active Users Today:**\n${topUsersDisplay}`
    ].join('\n');

    // Format time range for analytics
    const startTimeFormatted = todayStartUTC.toISOString().substring(11, 16); // HH:MM
    const nowTimeFormatted = now.toISOString().substring(11, 16); // HH:MM

    // Prepare Discord webhook payload
    const webhookPayload = {
      username: 'Dev-insights logs',
      embeds: [{
        title: `Devvit logs: r/${subname} time: ${timestamp}`,
        color: 15105570,
        fields: [
          {
            name: `Analytics Summary (Today UTC) ${startTimeFormatted} - ${nowTimeFormatted}`,
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
