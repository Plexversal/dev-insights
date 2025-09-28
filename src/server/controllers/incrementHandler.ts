import { Request, Response } from 'express';
import { IncrementResponse } from '../../shared/types/api';
import { redis, context } from '@devvit/web/server';

export const incrementHandler = async (
  _req: Request,
  res: Response<IncrementResponse | { status: string; message: string }>
): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({
      status: 'error',
      message: 'postId is required',
    });
    return;
  }

  res.json({
    count: await redis.incrBy('count', 1),
    postId,
    type: 'increment',
  });
};