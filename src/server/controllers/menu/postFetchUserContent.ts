import { Request, Response } from 'express';
import { context, settings, redis } from '@devvit/web/server';
import { fetchMultipleUsersContent } from '../../lib/fetchUserContent';

const ONE_HOUR_MS = 60 * 60 * 1000;
const RATE_LIMIT_KEY = 'user_fetch_last_run';

export const postFetchUserContent = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check rate limit
    const lastRun = await redis.get(RATE_LIMIT_KEY);
    const now = Date.now();

    if (lastRun) {
      const lastRunTime = parseInt(lastRun);
      const timeSinceLastRun = now - lastRunTime;

      if (timeSinceLastRun < ONE_HOUR_MS) {
        const remainingMinutes = Math.ceil((ONE_HOUR_MS - timeSinceLastRun) / 60000);
        res.json({
          showToast: `Please wait ${remainingMinutes} minutes before fetching user content again.`
        });
        return;
      }
    }

    // Get users from settings
    const subredditUsers = await settings.get('subredditUsers');

    // Parse comma-separated strings into arrays
    const usersArray = (subredditUsers as string || '')
      .split(',')
      .map(u => u.trim().replace(/^u\//, ''))
      .filter(u => u.length > 0);

    if (usersArray.length === 0) {
      res.json({
        showToast: 'No users configured in settings. Please add usernames to track.'
      });
      return;
    }

    console.log(`[postFetchUserContent] Fetching content for ${usersArray.length} users`);

    // Update rate limit timestamp before starting (prevents concurrent executions)
    await redis.set(RATE_LIMIT_KEY, now.toString());

    // Fetch content for all users
    const results = await fetchMultipleUsersContent(usersArray, 100);

    // Calculate summary
    let totalPosts = 0;
    let totalComments = 0;
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    results.forEach(result => {
      if (result.success) {
        successCount++;
        totalPosts += result.postsAdded;
        totalComments += result.commentsAdded;
        console.log(`[postFetchUserContent] ✓ ${result.username}: ${result.postsAdded} posts, ${result.commentsAdded} comments`);
      } else {
        failCount++;
        errors.push(`${result.username}: ${result.error}`);
        console.error(`[postFetchUserContent] ✗ ${result.username}: ${result.error}`);
      }
    });

    console.log(`[postFetchUserContent] Summary: ${successCount}/${usersArray.length} users successful, ${totalPosts} posts, ${totalComments} comments added`);

    // Build response message
    let message = `✓ Fetched content from ${successCount}/${usersArray.length} users\n`;
    message += `Added ${totalPosts} posts and ${totalComments} comments`;

    if (failCount > 0) {
      message += `\n\nFailed users:\n${errors.join('\n')}`;
    }

    res.json({
      showToast: 'Posts and Comments being have been fetched from users configured in app settings. (this can only be done every hour.)'
    });

  } catch (error) {
    console.error(`[postFetchUserContent] Error:`, error);
    res.status(400).json({
      showToast: 'Processing failed. Please try again or check console logs.'
    });
  }
};
