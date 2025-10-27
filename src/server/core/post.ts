import { context, reddit, settings } from '@devvit/web/server';
import additionalModActions from '../lib/postAppCreateAdditionalModActions';
export const createPost = async (title?: string) => {
  let postTitle: string;

  if (title) {
    // Use the provided title
    postTitle = title;
  } else {
    // Fallback to settings if no title provided
    const settingsTitle = await settings.get('postTitle');
    postTitle = typeof settingsTitle === 'string' && settingsTitle.trim() !== ''
      ? settingsTitle
      : 'Official Announcements';
  }

  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  let post = await reddit.submitCustomPost({
    splash: {
      appDisplayName: 'Dev-Insights',
    },
    subredditName: subredditName,
    title: `${postTitle}`, // should be string anyway but yeah.. safe
  });

  return await additionalModActions(post)
  
};
