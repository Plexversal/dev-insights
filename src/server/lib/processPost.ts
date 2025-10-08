import { redis, reddit, Post } from '@devvit/web/server';
import { PostData, PostDatRecord } from '../../shared/types/post';

/**
 * Process and store a post in Redis
 */
export async function processPost(post: Post): Promise<void> {
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
      throw new Error('Post already exists');
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
