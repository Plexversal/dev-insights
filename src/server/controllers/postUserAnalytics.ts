import { Request, Response } from 'express';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';

export const postUserAnalytics = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
};
