import { reddit, redis, context, Post, Comment } from '@devvit/web/server';
import { processPost } from './processPost';
import { processComment } from './processComment';

interface FetchUserContentResult {
  success: boolean;
  username: string;
  postsAdded: number;
  commentsAdded: number;
  error?: string;
}

/**
 * Fetches posts and comments from a user and stores them in Redis
 * @param username - Username without u/ prefix
 * @param limit - Maximum number of items to fetch
 * @returns Result object with success status and counts
 */
export async function fetchUserContent(
  username: string,
  limit: number = 7
): Promise<FetchUserContentResult> {
  const result: FetchUserContentResult = {
    success: false,
    username,
    postsAdded: 0,
    commentsAdded: 0
  };

  try {
    // Validate username (basic sanitization)
    const sanitizedUsername = username.trim().replace(/^u\//, '');

    if (!sanitizedUsername || sanitizedUsername.length === 0) {
      result.error = 'Invalid username: empty string';
      return result;
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedUsername)) {
      result.error = `Invalid username format: ${sanitizedUsername}`;
      return result;
    }

    console.log(`[fetchUserContent] Fetching content for user: ${sanitizedUsername}`);

    // Fetch user's posts and comments
    const listing = await reddit.getCommentsAndPostsByUser({
      username: sanitizedUsername,
      limit,
      pageSize: Math.min(100, limit),
      sort: 'new'
    });

    const items = await listing.all();
    console.log(items)
    console.log(`[fetchUserContent] Found ${items.length} items for ${sanitizedUsername}`);

    // Process each item
    for (const item of items) {
      try {
        const itemId = item.id;
        const subredditName = item.subredditName;

        // Only process items from the current subreddit
        if (subredditName !== context.subredditName) {
          console.log(`[fetchUserContent] Skipping item ${itemId} from different subreddit: ${subredditName}`);
          continue;
        }

        // Type guard: Posts have 'title' property, Comments have 'parentId'
        if ('title' in item) {
          // It's a post
          try {
            await processPost(item as Post);
            result.postsAdded++;
          } catch (err: any) {
            if (err?.message?.includes('already exists')) {
              // Skip duplicates silently in bulk operations
              console.log(`[fetchUserContent] Skipping duplicate post ${itemId}`);
            } else {
              throw err;
            }
          }
        } else if ('parentId' in item) {
          // It's a comment
          try {
            await processComment(item as Comment);
            result.commentsAdded++;
          } catch (err: any) {
            if (err?.message?.includes('already exists')) {
              // Skip duplicates silently in bulk operations
              console.log(`[fetchUserContent] Skipping duplicate comment ${itemId}`);
            } else {
              throw err;
            }
          }
        } else {
          console.warn(`[fetchUserContent] Unknown item type for ${itemId}`);
        }
      } catch (itemError) {
        console.error(`[fetchUserContent] Error processing item:`, itemError);
        // Continue processing other items
      }
    }

    result.success = true;
    console.log(`[fetchUserContent] Successfully processed ${result.postsAdded} posts and ${result.commentsAdded} comments for ${sanitizedUsername}`);

  } catch (error: any) {
    console.error(`[fetchUserContent] Error fetching content for ${username}:`, error);

    // Handle specific error types
    if (error?.message?.includes('USER_DOESNT_EXIST')) {
      result.error = `User not found: ${username}`;
    } else if (error?.message?.includes('FORBIDDEN')) {
      result.error = `Access forbidden for user: ${username}`;
    } else if (error?.message?.includes('SUSPENDED')) {
      result.error = `User is suspended: ${username}`;
    } else {
      result.error = error?.message || 'Unknown error';
    }
  }

  return result;
}


/**
 * Fetch content for multiple users
 * @param usernames - Array of usernames
 * @param limit - Maximum items per user
 * @returns Array of results for each user
 */
export async function fetchMultipleUsersContent(
  usernames: string[],
  limit: number = 10
): Promise<FetchUserContentResult[]> {
  const results: FetchUserContentResult[] = [];

  for (const username of usernames) {
    const result = await fetchUserContent(username, limit);
    results.push(result);
  }

  return results;
}
