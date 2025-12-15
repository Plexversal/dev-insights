import { Request, Response } from 'express';
import { context, settings, redis, reddit } from '@devvit/web/server';
import { processPost } from '../../lib/processPost';

interface PostMenuBody {
  targetId: `t3_${string}`;
  location: 'post'
}

export const postAddManualPost = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const body: PostMenuBody = _req.body;
    const post = await reddit.getPostById(body.targetId);

    if (!post) {
      res.status(404).json({
        showToast: 'Post not found'
      });
      return;
    }

    // Check if post is from current subreddit
    if (post.subredditName !== context.subredditName) {
      res.status(400).json({
        showToast: 'Cannot add posts from other subreddits'
      });
      return;
    }

    await processPost(post);

    res.json({
      showToast: 'Post added successfully!'
    });

  } catch (error: any) {
    console.error(`[postAddManualPost] Error:`, error);

    // Handle specific error cases
    const errorMessage = typeof error === 'string' ? error : error?.message || '';

    if (errorMessage.includes('already exists')) {
      res.status(400).json({
        showToast: 'Post already exists in the app'
      });
    } else {
      res.status(400).json({
        showToast: 'Failed to add post. Please try again.'
      });
    }
  }
};
