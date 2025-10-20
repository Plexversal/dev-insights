import { Request, Response } from 'express';
import { context, redis, reddit } from '@devvit/web/server';
import { CommentUpdateBody } from '../../../shared/types/api';

export const postOnCommentUpdate = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const body: CommentUpdateBody = _req.body;
    // console.log(body)

    const comment = body.comment;

    // console.log(`Processing comment update: ${comment.id}`);

    // Check if comment exists in Redis
    const dataKey = `comment_data:${comment.id}`;
    const exists = await redis.exists(dataKey);

    if (!exists) {
      // console.log(`Comment ${comment.id} not found in Redis, skipping update`);
      res.json({
        status: 'skipped',
        message: 'Comment not found in database',
        commentId: comment.id
      });
      return;
    }

    // Update only the body field (first 200 chars)
    await redis.hSet(dataKey, {
      body: comment.body.substring(0, 200)
    });

    // console.log(`Comment ${comment.id} body updated successfully`);

    res.json({
      status: 'success',
      message: 'Comment body updated successfully',
      commentId: comment.id,
      debug: {
        dataKey,
        updatedBody: comment.body.substring(0, 200)
      }
    });
  } catch (error) {
    console.error(`Error handling comment update: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to update comment',
      error: error
    });
  }
};
