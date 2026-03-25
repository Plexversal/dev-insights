import { redis, reddit, context, Comment } from '@devvit/web/server';
import { CommentData, CommentDataRecord } from '../../shared/types/comment';

/**
 * Process and store a comment in Redis
 */
export async function processComment(comment: Comment): Promise<void> {
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

    // Subreddit validation
    const expectedSubreddit = context.subredditName;
    const commentSubreddit = comment.subredditName;
    const permalinkSubreddit = comment.permalink ? extractSubredditFromPermalink(comment.permalink) : undefined;

    if (commentSubreddit && expectedSubreddit && commentSubreddit.toLowerCase() !== expectedSubreddit.toLowerCase()) {
      console.warn(`[processComment] BLOCKED cross-subreddit comment ${commentId}: comment.subredditName=${commentSubreddit} expected=${expectedSubreddit}`);
      throw new Error(`Cross-subreddit comment blocked: ${commentSubreddit} !== ${expectedSubreddit}`);
    }

    if (permalinkSubreddit && expectedSubreddit && permalinkSubreddit.toLowerCase() !== expectedSubreddit.toLowerCase()) {
      console.warn(`[processComment] BLOCKED cross-subreddit comment ${commentId}: permalink r/${permalinkSubreddit} != expected r/${expectedSubreddit}`);
      throw new Error(`Cross-subreddit comment blocked: permalink mismatch`);
    }

    const key = 'global_comments';
    const dataKey = `comment_data:${commentId}`;

    // Check if comment already exists
    const exists = await redis.exists(dataKey);
    if (exists) {
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
      parentPostTitle: parentPostTitle || 'Unknown Post',
      subredditName: commentSubreddit || expectedSubreddit || ''
    };

    // Store the detailed data in a hash
    await redis.hSet(dataKey, commentData as unknown as CommentDataRecord);

    // Store comment ID in sorted set for ordering
    await redis.zAdd(key, {
      member: commentId,
      score: timestamp
    });

    // console.log(`[processComment] Stored comment ${commentId}`);
  } catch (error) {
    console.error(`[processComment] Error processing comment:`, error);
    throw error;
  }
}

function extractSubredditFromPermalink(permalink: string): string | undefined {
  const match = permalink.match(/\/r\/([^/]+)/);
  return match ? match[1] : undefined;
}
