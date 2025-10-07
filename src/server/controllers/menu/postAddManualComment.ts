import { Request, Response } from 'express';
import { context, settings, redis, reddit } from '@devvit/web/server';

interface CommentMenuBody {
  targetId: `t1_${string}`; 
  location: 'post'
}

export const postAddManualComment = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    let body: CommentMenuBody = _req.body
    let comment = await reddit.getCommentById(body.targetId)

    res.json({
      showToast: 'console logged body of comment.)'
    });

  } catch (error) {
    console.error(`[postFetchUserContent] Error:`, error);
    res.status(400).json({
      showToast: 'Processing failed. Please try again or check console logs.'
    });
  }
};
