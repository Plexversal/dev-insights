import { Request, Response } from 'express';
import { context, Post } from '@devvit/web/server';
import { createPost } from '../../core/post';
import afterAppCreate from '../../lib/afterAppCreate';

export const postOnAppUpgrade = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {

    const post: Post = await createPost();
    await afterAppCreate(post);

    res.json({
      status: 'success',
      message: `App upgraded in subreddit ${context.subredditName}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
};
