import { context, Post, reddit } from '@devvit/web/server';
import additionalModActions from './postAppCreateAdditionalModActions';

export default async function afterAppCreate(post: Post) {
  let appPosts: Post[] = [];

  try {
    const appPostsListing = await reddit.getPostsByUser({
      username: context.appName,
      limit: 100,
      pageSize: 100,
    });
    appPosts = await appPostsListing.all();
  } catch (err) {
    console.error('[afterAppCreate] Failed to fetch app posts:', err);
  }

  for (const appPost of appPosts) {
    try {
      if (appPost.subredditName === context.subredditName && appPost.id !== post.id) {
        await appPost.delete();
      }
    } catch (err) {
      console.error(`[afterAppCreate] Error deleting post ${appPost.id}:`, err);
    }
  }

  return await additionalModActions(post);
}
