
import { context, Post, reddit } from '@devvit/web/server';

export default async function afterAppCreate(post: Post) {

  // Fetch all posts by the app in this subreddit
  const appPostsListing = await reddit.getPostsByUser({
    username: context.appName,
    limit: 100,
    pageSize: 100
  });

  const appPosts = await appPostsListing.all();
  console.log(`[afterAppCreate] Found ${appPosts.length} posts by ${context.appName}`);

  // Delete all app posts from the current subreddit (excluding the current one)
  for (const appPost of appPosts) {
    try {
      // Only delete posts from this subreddit
      if (appPost.subredditName === context.subredditName) {
        // Don't delete the post we just created
        if (appPost.id !== post.id) {
          console.log(`[afterAppCreate] Deleting old app post: ${appPost.id} from ${appPost.subredditName}`);
          await appPost.delete()
        }
      } else {
        console.log(`[afterAppCreate] Skipping post ${appPost.id} from different subreddit: ${appPost.subredditName}`);
      }
    } catch (error) {
      console.error(`[afterAppCreate] Error deleting post ${appPost.id}:`, error);
      // Continue processing other posts even if one fails
    }
  }

  await post.addComment({
    runAs: 'APP',
    text: `This post shows a collection of most recent comments and posts made by the game devs. This is made using Reddits new Devvit App experience.\n\nFor the best experience, make sure you are using the modern Reddit rather than old. Old reddit will still show most recent post links.\n\nIf you encounter any issues with loading or have a feature request/feedback, feel free to click "report issue" within this app post.\n\n### If you want to hide the post:\n\nYou can hide the post by clicking the 3 \`•••\` at the top right of the post > Hide.`
  }).then(c => c.distinguish(true))
  await post.sticky();
  await post.lock();
}
