import { reddit, context, redis } from '@devvit/web/server';

const ONE_HOUR_MS = 60000 * 5; // 5 mins
const RATE_LIMIT_KEY = 'old_reddit_update_last_run';

export const updateOldReddit = async () => {
  if(!context.postId) {
    // console.log('no post id in context')
    return;
  }

  // Check rate limit
  // console.log('running old reddit update function')
  const lastRun = await redis.get(RATE_LIMIT_KEY);
  const now = Date.now();

  if (lastRun) {
    const lastRunTime = parseInt(lastRun);
    const timeSinceLastRun = now - lastRunTime;

    if (timeSinceLastRun < ONE_HOUR_MS) {
      // console.log(`[updateOldReddit] Skipping update - last run was ${Math.floor(timeSinceLastRun / 60000)} minutes ago`);
      return;
    }
  }

  try {
    // console.log('[updateOldReddit] Fetching latest 25 posts for old Reddit fallback');

    // Get latest 25 post IDs from Redis sorted set
    const posts = await redis.zRange('global_posts', 0, 24, {
      by: 'rank',
      reverse: true
    });
    const postIds = posts.map((p: any) => p.member);

    // console.log(`[updateOldReddit] Found ${postIds.length} posts`);

    // Fetch post data and build markdown list
    const markdownLines = ['## This post is made for new reddit... but here is a glimpse\n**Below is a list of prominent posts for this community, this list updates automatically. Showing last 25 Posts**\n'];

    for (const postId of postIds) {
      try {
        const dataKey = `post_data:${postId}`;
        const postData = await redis.hGetAll(dataKey);

        if (Object.keys(postData).length > 0 && postData.title && postData.permalink && postData.authorName) {
          // Format as: - [Title](https://reddit.com/permalink) by username
          const fullLink = `https://reddit.com${postData.permalink}`;
          markdownLines.push(`- [${postData.title}](${fullLink}) by ${postData.authorName}`);
        }
      } catch (err) {
        console.error(`[updateOldReddit] Error fetching data for post ${postId}:`, err);
      }
    }

    // Add separator at the end
    markdownLines.push(`\n`);

    const markdownText = markdownLines.join('\n');

    // Update the post
    const post = await reddit.getPostById(context.postId);
    await post.setTextFallback({ text: markdownText });

    // Update rate limit timestamp
    await redis.set(RATE_LIMIT_KEY, now.toString());

    // console.log(`[updateOldReddit] Successfully updated old Reddit fallback with ${postIds.length} posts`);
  } catch (error) {
    console.error('[updateOldReddit] Error updating old Reddit fallback:', error);
  }
}
