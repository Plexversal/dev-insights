import { Request, Response } from 'express';
import { context, redis, reddit } from '@devvit/web/server';
import { CommentDeleteBody } from '../../../shared/types/api';

export const postOnCommentDelete = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const body: CommentDeleteBody = _req.body;
    // console.log(body)

    const commentId = body.commentId;

    // console.log(`Processing comment delete: ${commentId}`);

    // Delete from sorted set
    const zRemResult = await redis.zRem('global_comments', [commentId]);

    // Delete the comment data hash
    const dataKey = `comment_data:${commentId}`;
    await redis.del(dataKey);

    // console.log(`Comment ${commentId} deleted. zRem result: ${zRemResult}`);

    res.json({
      status: 'success',
      message: 'Comment deleted successfully',
      commentId,
      debug: {
        dataKey,
        zRemResult
      }
    });
  } catch (error) {
    console.error(`Error handling comment deletion: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to delete comment',
      error: error
    });
  }
};
