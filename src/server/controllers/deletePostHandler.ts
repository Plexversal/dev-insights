import { Request, Response } from 'express';
import { redis } from '@devvit/web/server';
import { checkMod } from '../lib/checkMod';
export const deletePostHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'Post ID is required'
      });
      return;
    }

    let modCheckResult = await checkMod()

    if(!modCheckResult.isMod) {
      res.status(403).json({
        status: 'error',
        message: 'No mod permissions.'
      });
      return;
    }

    console.log(`Deleting post: ${postId}`);

    // Delete from sorted set
    const zRemResult = await redis.zRem('global_posts', [postId]);

    // Delete the post data hash
    const dataKey = `post_data:${postId}`;
    await redis.del(dataKey);

    console.log(`Post ${postId} deleted. zRem result: ${zRemResult}`);

    res.json({
      status: 'success',
      message: 'Post deleted successfully',
      postId
    });
  } catch (error) {
    console.error(`Error deleting post:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete post',
    });
  }
};
