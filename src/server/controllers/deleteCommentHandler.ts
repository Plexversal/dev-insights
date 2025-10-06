import { Request, Response } from 'express';
import { redis } from '@devvit/web/server';
import { checkMod } from '../lib/checkMod';
export const deleteCommentHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { commentId } = req.params;

    if (!commentId) {
      res.status(400).json({
        status: 'error',
        message: 'Comment ID is required'
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

    console.log(`Deleting comment: ${commentId}`);

    // Delete from sorted set
    const zRemResult = await redis.zRem('global_comments', [commentId]);

    // Delete the comment data hash
    const dataKey = `comment_data:${commentId}`;
    await redis.del(dataKey);

    console.log(`Comment ${commentId} deleted. zRem result: ${zRemResult}`);

    res.json({
      status: 'success',
      message: 'Comment deleted successfully',
      commentId
    });
  } catch (error) {
    console.error(`Error deleting comment:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete comment',
    });
  }
};
