import { Request, Response } from 'express';
import { context, settings, redis, reddit } from '@devvit/web/server';

interface PostMenuBody {
  targetId: `t3_${string}`; 
  location: 'post'
}

export const postAddManualPost = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    let body: PostMenuBody = _req.body
    let post = await reddit.getPostById(body.targetId)

    res.json({
      showToast: 'console logged body of post.)'
    });

  } catch (error) {
    console.error(`[postFetchUserContent] Error:`, error);
    res.status(400).json({
      showToast: 'Processing failed. Please try again or check console logs.'
    });
  }
};
