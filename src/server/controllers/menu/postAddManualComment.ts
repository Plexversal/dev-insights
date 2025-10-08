import { Request, Response } from 'express';
import { context, settings, redis, reddit } from '@devvit/web/server';
import { processComment } from '../../lib/processComment';

interface CommentMenuBody {
  targetId: `t1_${string}`;
  location: 'post'
}

export const postAddManualComment = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const body: CommentMenuBody = _req.body;
    const comment = await reddit.getCommentById(body.targetId);

    if (!comment) {
      res.status(404).json({
        showToast: 'Comment not found'
      });
      return;
    }

    // Check if comment is from current subreddit
    if (comment.subredditName !== context.subredditName) {
      res.status(400).json({
        showToast: 'Cannot add comments from other subreddits'
      });
      return;
    }

    await processComment(comment);

    res.json({
      showToast: 'Comment added successfully!'
    });

  } catch (error: any) {
    console.error(`[postAddManualComment] Error:`, error);

    // Handle specific error cases
    if (error?.message?.includes('already exists')) {
      res.status(400).json({
        showToast: 'Comment already exists in the app'
      });
    } else {
      res.status(400).json({
        showToast: 'Failed to add comment. Please try again.'
      });
    }
  }
};
