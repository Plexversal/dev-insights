import { redis, context } from '@devvit/web/server';
import { CommentData, CommentDataRecord, RedditComment } from '../../shared/types/comment';

interface AddCommentResult {
  success: boolean;
  commentId: string;
  error?: string;
}

/**
 * Adds a comment to the Redis database
 * @param comment - The Reddit comment object
 * @param authorName - The comment author's username
 * @param repliedToUser - The username of the user being replied to
 * @param parentPostTitle - The title of the parent post
 * @returns Result object with success status
 */
export async function addCommentToDb(
  comment: RedditComment,
  authorName: string,
  repliedToUser: string,
  parentPostTitle: string,
  sourceSubredditName?: string
): Promise<AddCommentResult> {
  try {
    const key = 'global_comments';
    const dataKey = `comment_data:${comment.id}`;
    const timestamp = comment.createdAt;
    const correctUrl = `https://www.reddit.com${comment.permalink}`;
    const expectedSubreddit = context.subredditName;

    // Subreddit validation
    const permalinkSubreddit = comment.permalink ? extractSubredditFromPermalink(comment.permalink) : undefined;

    if (sourceSubredditName && expectedSubreddit && sourceSubredditName !== expectedSubreddit) {
      console.warn(`[addCommentToDb] BLOCKED cross-subreddit comment ${comment.id}: source=${sourceSubredditName} expected=${expectedSubreddit}`);
      return { success: false, commentId: comment.id, error: `Cross-subreddit comment blocked` };
    }

    if (permalinkSubreddit && expectedSubreddit && permalinkSubreddit.toLowerCase() !== expectedSubreddit.toLowerCase()) {
      console.warn(`[addCommentToDb] BLOCKED cross-subreddit comment ${comment.id}: permalink r/${permalinkSubreddit} != expected r/${expectedSubreddit}`);
      return { success: false, commentId: comment.id, error: `Cross-subreddit comment blocked: permalink mismatch` };
    }

    // Check if comment already exists
    const exists = await redis.exists(dataKey);
    if (exists) {
      // console.log(`[addCommentToDb] Comment ${comment.id} already exists, skipping`);
      return {
        success: false,
        commentId: comment.id,
        error: 'Comment already exists'
      };
    }

    // Prepare comment data
    const commentData: CommentData = {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.author,
      authorName: authorName || comment.author,
      body: comment.body.substring(0, 200),
      score: comment.score.toString(),
      permalink: comment.permalink,
      timestamp: timestamp.toString(),
      url: correctUrl,
      repliedToUser: repliedToUser || '',
      parentPostTitle: parentPostTitle.substring(0, 50),
      subredditName: sourceSubredditName || expectedSubreddit || ''
    };

    // console.log(`[addCommentToDb] Storing comment data:`, commentData);

    // Store the detailed data in a hash
    await redis.hSet(dataKey, commentData as unknown as CommentDataRecord);

    // Store comment ID in sorted set for ordering
    await redis.zAdd(key, {
      member: comment.id,
      score: timestamp
    });

    // console.log(`[addCommentToDb] Successfully stored comment ${comment.id}`);

    return {
      success: true,
      commentId: comment.id
    };
  } catch (error) {
    console.error(`[addCommentToDb] Error adding comment to database:`, error);
    return {
      success: false,
      commentId: comment.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function extractSubredditFromPermalink(permalink: string): string | undefined {
  const match = permalink.match(/\/r\/([^/]+)/);
  return match ? match[1] : undefined;
}
