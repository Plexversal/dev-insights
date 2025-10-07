import { reddit, redis, context, Post, Comment } from '@devvit/web/server';
import { CommentData, CommentDataRecord } from '../../shared/types/comment';
import { PostData, PostDatRecord } from '../../shared/types/post';

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
          await processPost(item as Post);
          result.postsAdded++;
        } else if ('parentId' in item) {
          // It's a comment
          await processComment(item as Comment);
          result.commentsAdded++;
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
 * Process and store a post in Redis
 */
async function processPost(post: Post): Promise<void> {
  try {
    // Get properties from getters
    const postId = post.id;
    const authorId = post.authorId;
    const authorName = post.authorName;

    // Validate post data
    if (!postId || !authorId) {
      console.warn(`[processPost] Skipping post with missing ID or authorId`);
      return;
    }

    const key = 'global_posts';
    const dataKey = `post_data:${postId}`;

    // Check if post already exists
    const exists = await redis.exists(dataKey);
    if (exists) {
      console.log(`[processPost] Post ${postId} already exists, skipping`);
      return;
    }

    const timestamp = post.createdAt?.getTime() || Date.now();
    const permalink = post.permalink || '';
    const correctUrl = `https://www.reddit.com${permalink}`;

    // Fetch additional user data with error handling
    let snoovatarImage = '';
    let userProfileLink = '';

    try {
      const user = await reddit.getUserById(authorId);
      try {
        snoovatarImage = (await user?.getSnoovatarUrl()) ?? '';
      } catch {
        snoovatarImage = '';
      }
      userProfileLink = user?.url || '';
    } catch (userError) {
      console.warn(`[processPost] Could not fetch user data for ${authorId}`);
      // Continue without user data
    }

    // Determine post type from URL or gallery property
    let image = '';
    let galleryImages = '';
    let postLink = '';
    const postUrl = post.url || '';

    // Gallery is always an array in the official Post type
    if (post.gallery.length > 0) {
      try {
        galleryImages = JSON.stringify(post.gallery);
      } catch (err) {
        console.warn(`[processPost] Could not stringify gallery for ${postId}`);
        galleryImages = '';
      }
    } else if (postUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      image = postUrl;
    } else if (postUrl && !postUrl.includes('/comments/')) {
      postLink = postUrl;
    }

    console.log({
      id: post.id,
      authorId: post.authorId,
      authorName: post.authorName,
      subredditId: post.subredditId,
      subredditName: post.subredditName,
      permalink: post.permalink,
      title: post.title,
      body: post.body,
      bodyHtml: post.bodyHtml,
      url: post.url,
      thumbnail: post.thumbnail,
      createdAt: post.createdAt,
      score: post.score,
      numberOfComments: post.numberOfComments,
      numberOfReports: post.numberOfReports,
      approved: post.approved,
      approvedAtUtc: post.approvedAtUtc,
      bannedAtUtc: post.bannedAtUtc,
      spam: post.spam,
      stickied: post.stickied,
      removed: post.removed,
      removedBy: post.removedBy,
      removedByCategory: post.removedByCategory,
      archived: post.archived,
      edited: post.edited,
      locked: post.locked,
      nsfw: post.nsfw,
      quarantined: post.quarantined,
      spoiler: post.spoiler,
      hidden: post.hidden,
      ignoringReports: post.ignoringReports,
      distinguishedBy: post.distinguishedBy,
      flair: post.flair,
      secureMedia: post.secureMedia,
      userReportReasons: post.userReportReasons,
      modReportReasons: post.modReportReasons,
      gallery: post.gallery
    })

    // Thumbnail is always an object or undefined in the official Post type
    const thumbnailUrl = post.thumbnail?.url || '';

    const postData: PostData = {
      id: postId,
      authorId: authorId || '',
      authorName: authorName || 'Unknown',
      snoovatarImage: snoovatarImage || '',
      userProfileLink: userProfileLink || '',
      title: post.title || '',
      body: (post.body || '').substring(0, 200),
      thumbnail: thumbnailUrl || '',
      score: post.score?.toString() || '0',
      permalink: permalink || '',
      timestamp: timestamp.toString(),
      image: image || '',
      galleryImages: galleryImages || '',
      postLink: postLink || ''
    };

    // Store the detailed data in a hash
    await redis.hSet(dataKey, postData as unknown as PostDatRecord);

    // Store post ID in sorted set for ordering
    await redis.zAdd(key, {
      member: postId,
      score: timestamp
    });

    console.log(`[processPost] Stored post ${postId}`);
  } catch (error) {
    console.error(`[processPost] Error processing post:`, error);
    throw error;
  }
}

/**
 * Process and store a comment in Redis
 */
async function processComment(comment: Comment): Promise<void> {
  try {
    // Get properties from getters
    const commentId = comment.id;
    const authorId = comment.authorId;
    const authorName = comment.authorName;

    // Validate comment data
    if (!commentId || !authorId) {
      console.warn(`[processComment] Skipping comment with missing ID or authorId`);
      return;
    }

    const key = 'global_comments';
    const dataKey = `comment_data:${commentId}`;

    // Check if comment already exists
    const exists = await redis.exists(dataKey);
    if (exists) {
      console.log(`[processComment] Comment ${commentId} already exists, skipping`);
      return;
    }

    const timestamp = comment.createdAt?.getTime() || Date.now();
    const permalink = comment.permalink || '';
    const correctUrl = `https://www.reddit.com${permalink}`;

    // Try to get the parent post details
    let parentPostTitle = 'Unknown Post';
    let repliedToUser = '';

    try {
      const postId = comment.postId;
      if (postId) {
        const post = await reddit.getPostById(postId);
        parentPostTitle = post?.title?.substring(0, 50) || 'Unknown Post';

        const postAuthorId = post?.authorId;
        if (postAuthorId) {
          try {
            const postAuthor = await reddit.getUserById(postAuthorId);
            repliedToUser = postAuthor?.username || '';
          } catch {
            // Skip if can't get post author
          }
        }
      }
    } catch (err) {
      console.warn(`[processComment] Could not fetch parent post details for comment ${commentId}`);
    }

    const commentData: CommentData = {
      id: commentId,
      postId: comment.postId || '',
      authorId: authorId || '',
      authorName: authorName || 'Unknown',
      body: (comment.body || '').substring(0, 200),
      score: comment.score?.toString() || '0',
      permalink: permalink || '',
      timestamp: timestamp.toString(),
      url: correctUrl || '',
      repliedToUser: repliedToUser || '',
      parentPostTitle: parentPostTitle || 'Unknown Post'
    };

    // Store the detailed data in a hash
    await redis.hSet(dataKey, commentData as unknown as CommentDataRecord);

    // Store comment ID in sorted set for ordering
    await redis.zAdd(key, {
      member: commentId,
      score: timestamp
    });

    console.log(`[processComment] Stored comment ${commentId}`);
  } catch (error) {
    console.error(`[processComment] Error processing comment:`, error);
    throw error;
  }
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
