import { redis, reddit, context } from '@devvit/web/server';
import { PostData, PostDatRecord, RedditPost } from '../../shared/types/post';
import { notificationService } from './notificationService';

interface AddPostResult {
  success: boolean;
  postId: string;
  error?: string;
}

/**
 * Adds a post to the Redis database
 * @param post - The Reddit post object
 * @param userSnoovatarImage - Optional snoovatar image URL
 * @param userProfileLink - Optional user profile link
 * @returns Result object with success status
 */
export async function addPostToDb(
  post: RedditPost,
  authorName: string,
  userSnoovatarImage?: string,
  userProfileLink?: string
): Promise<AddPostResult> {
  try {
    const key = 'global_posts';
    const dataKey = `post_data:${post.id}`;
    const timestamp = post.createdAt;

    // Check if post already exists
    const exists = await redis.exists(dataKey);
    if (exists) {
      console.log(`[addPostToDb] Post ${post.id} already exists, skipping`);
      return {
        success: false,
        postId: post.id,
        error: 'Post already exists'
      };
    }

    // Prepare post data
    const postData: PostData = {
      id: post.id,
      authorId: post.authorId,
      authorName: authorName, // Will be overridden if user data is provided
      snoovatarImage: userSnoovatarImage || '',
      userProfileLink: userProfileLink || '',
      title: post.title,
      body: post.selftext.substring(0, 200),
      thumbnail: post.thumbnail,
      score: post.score.toString(),
      permalink: post.permalink,
      timestamp: timestamp.toString(),
      image: post.type === 'image' ? post.url : '',
      galleryImages: post.type === 'gallery' ? JSON.stringify(post.galleryImages) : '',
      postLink: post.type === 'link' ? post.url : ''
    };

    console.log(`[addPostToDb] Storing post data:`, postData);

    // Store the detailed data in a hash
    await redis.hSet(dataKey, postData as unknown as PostDatRecord);

    // Store post ID in sorted set for ordering
    await redis.zAdd(key, {
      member: post.id,
      score: timestamp
    });

    console.log(`[addPostToDb] Successfully stored post ${post.id}`);

    // Queue notification for this new post (non-blocking)
    const subredditName = context.subredditName || 'unknown';
    notificationService.queueNotification({
      postId: post.id,
      permalink: post.permalink,
      authorName: authorName,
      subredditName: subredditName,
      timestamp: timestamp,
    }).catch(error => {
      console.error(`[addPostToDb] Error queuing notification for post ${post.id}:`, error);
      // Don't fail the post addition if notification queueing fails
    });

    return {
      success: true,
      postId: post.id
    };
  } catch (error) {
    console.error(`[addPostToDb] Error adding post to database:`, error);
    return {
      success: false,
      postId: post.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
