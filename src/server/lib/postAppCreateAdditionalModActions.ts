import { context, Post, reddit } from '@devvit/web/server';

export default async function additionalModActions(post: Post) {
  try {
    await post.addComment({
      runAs: 'APP',
      text: `This post shows a collection of the most recent official replies and posts made by community figures/official accounts. This is made using Reddits new Devvit App experience.\n\nFor the best experience, make sure you are using the modern Reddit rather than old. Old reddit will still show most recent post links.\n\nIf you encounter any issues with loading or have a feature request/feedback, feel free to click "report issue" within this app post.\n\n### If you want to hide the post:\n\nYou can hide the post by clicking the 3 \`•••\` at the top right of the post > Hide.`
    }).then(c => c.distinguish(true));
  } catch (err) {
    console.error('Failed to add or distinguish comment:', err);
  }

  try {
    await post.sticky();
  } catch (err) {
    console.error('Failed to sticky post:', err);
  }

  try {
    await post.lock();
  } catch (err) {
    console.error('Failed to lock post:', err);
  }

  return post;
}
