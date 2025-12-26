import { reddit, redis, context, Post, Comment, settings } from '@devvit/web/server';
import { processPost } from './processPost';
import { processComment } from './processComment';
import { validatePostFlair } from './validatePostFlair';

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
  limit: number = 100
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

    // console.log(`[fetchUserContent] Fetching content for user: ${sanitizedUsername}`);

    // Get the dependant flair matches setting
    const dependantFlairMatches = await settings.get('dependantFlairMatches') as boolean;

    // Fetch user's posts
    const postsListing = await reddit.getPostsByUser({
      username: sanitizedUsername,
      limit,
      pageSize: 100,
      sort: 'new'
    });

    const posts: Post[] = await postsListing.all();
    // console.log(`[fetchUserContent] Found ${posts.length} posts for ${sanitizedUsername}`);
    console.log(posts.length)
    // Process each post
    for (const post of posts) {
      try {
        const postId = post.id;
        const subredditId = post.subredditId;

        // Only process items from the current subreddit
        if (subredditId !== context.subredditId) {
          // console.log(`[fetchUserContent] Skipping post ${postId} from different subreddit: ${subredditName}`);
          continue;
        }

        // If dependant flair matching is enabled, validate the post flair
        if (dependantFlairMatches) {
          const flairValidation = await validatePostFlair(post.flair);
          if (!flairValidation.isValid) {
            // console.log(`[fetchUserContent] Skipping post ${postId} - flair validation failed: ${flairValidation.reason}`);
            continue;
          }
        }

        try {
          await processPost(post);
          result.postsAdded++;
        } catch (err: any) {
          const errMessage = typeof err === 'string' ? err : err?.message || '';
          if (errMessage.includes('already exists')) {
            // Skip duplicates silently in bulk operations
            // console.log(`[fetchUserContent] Skipping duplicate post ${postId}`);
          } else {
            throw err;
          }
        }
      } catch (itemError) {
        console.error(`[fetchUserContent] Error processing post:`, itemError);
        // Continue processing other items
      }
    }

    // Fetch user's comments
    const commentsListing = await reddit.getCommentsByUser({
      username: sanitizedUsername,
      limit,
      pageSize: 100,
      sort: 'new'
    });

    const comments = await commentsListing.all();
    // console.log(`[fetchUserContent] Found ${comments.length} comments for ${sanitizedUsername}`);

    // Process each comment
    for (const comment of comments) {
      try {
        const commentId = comment.id;
        const subredditName = comment.subredditName;

        // Only process items from the current subreddit
        if (subredditName !== context.subredditName) {
          // console.log(`[fetchUserContent] Skipping comment ${commentId} from different subreddit: ${subredditName}`);
          continue;
        }

        try {
          await processComment(comment);
          result.commentsAdded++;
        } catch (err: any) {
          const errMessage = typeof err === 'string' ? err : err?.message || '';
          if (errMessage.includes('already exists')) {
            // Skip duplicates silently in bulk operations
            // console.log(`[fetchUserContent] Skipping duplicate comment ${commentId}`);
          } else {
            throw err;
          }
        }
      } catch (itemError) {
        console.error(`[fetchUserContent] Error processing comment:`, itemError);
        // Continue processing other items
      }
    }

    result.success = true;
    // console.log(`[fetchUserContent] Successfully processed ${result.postsAdded} posts and ${result.commentsAdded} comments for ${sanitizedUsername}`);

  } catch (error: any) {
    console.error(`[fetchUserContent] Error fetching content for ${username}:`, error);

    // Handle specific error types
    const errorMessage = typeof error === 'string' ? error : error?.message || '';

    if (errorMessage.includes('USER_DOESNT_EXIST')) {
      result.error = `User not found: ${username}`;
    } else if (errorMessage.includes('FORBIDDEN')) {
      result.error = `Access forbidden for user: ${username}`;
    } else if (errorMessage.includes('SUSPENDED')) {
      result.error = `User is suspended: ${username}`;
    } else {
      result.error = errorMessage || 'Unknown error';
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
