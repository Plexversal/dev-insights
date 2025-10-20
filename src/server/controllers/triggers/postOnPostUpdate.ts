import { Request, Response } from 'express';
import { context, redis, reddit } from '@devvit/web/server';
import { PostUpdateBody } from '../../../shared/types/api';

export const postOnPostUpdate = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const body: PostUpdateBody = _req.body;
    // console.log(body)

    const post = body.post;

    // console.log(`Processing post update: ${post.id}`);

    // Check if post exists in Redis
    const dataKey = `post_data:${post.id}`;
    const exists = await redis.exists(dataKey);

    if (!exists) {
      // console.log(`Post ${post.id} not found in Redis, skipping update`);
      res.json({
        status: 'skipped',
        message: 'Post not found in database',
        postId: post.id
      });
      return;
    }

    // Update title and body fields (body limited to first 200 chars)
    await redis.hSet(dataKey, {
      title: post.title,
      body: post.selftext.substring(0, 200)
    });

    // console.log(`Post ${post.id} title and body updated successfully`);

    res.json({
      status: 'success',
      message: 'Post title and body updated successfully',
      postId: post.id,
      debug: {
        dataKey,
        updatedTitle: post.title,
        updatedBody: post.selftext.substring(0, 200)
      }
    });
  } catch (error) {
    console.error(`Error handling post update: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to update post',
      error: error
    });
  }
};
