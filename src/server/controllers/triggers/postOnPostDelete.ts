import { Request, Response } from 'express';
import { context, redis, reddit } from '@devvit/web/server';
import { PostDeleteBody } from '../../../shared/types/api';

export const postOnPostDelete = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const body: PostDeleteBody = _req.body;
    console.log(body)

    const postId = body.postId;
    console.log(`Processing post delete: ${postId}`);

    // Delete from sorted set
    const zRemResult = await redis.zRem('global_posts', [postId]);

    // Delete the post data hash
    const dataKey = `post_data:${postId}`;
    await redis.del(dataKey);

    console.log(`Post ${postId} deleted. zRem result: ${zRemResult}`);

    res.json({
      status: 'success',
      message: 'Post deleted successfully',
      postId,
      debug: {
        dataKey,
        zRemResult
      }
    });
  } catch (error) {
    console.error(`Error handling post deletion: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to delete post',
      error: error
    });
  }
};
