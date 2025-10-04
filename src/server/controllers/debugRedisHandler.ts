import { Request, Response } from 'express';
import { redis } from '@devvit/web/server';

export const debugRedisHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Debug global comments
    const key = 'global_comments';

    // Check if key exists
    const keyExists = await redis.exists(key);

    // Get all members from sorted set
    const comments = await redis.zRange(key, 0, -1, {
      by: 'rank',
      reverse: true
    });

    // Get cardinality (number of elements)
    const count = await redis.zCard(key);

    // Get all members with scores
    const commentsWithScores = await redis.zRange(key, 0, -1, {
      by: 'rank',
      reverse: false // Show in chronological order for debugging
    });

    res.json({
      status: 'success',
      key,
      keyExists,
      count,
      comments,
      commentsWithScores,
      debug: {
        message: 'Global Redis debug info',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error(`Error debugging global Redis:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to debug Redis',
      error: error.message
    });
  }
};
