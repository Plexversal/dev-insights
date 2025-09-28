import { Request, Response } from 'express';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';

export const appInstallHandler = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
};