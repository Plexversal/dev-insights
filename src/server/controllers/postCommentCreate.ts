import { Request, Response } from 'express';
import { context, redis } from '@devvit/web/server';
import { RedditComment } from '../../shared/types/comment';

export const postCommentCreate = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const comment: RedditComment = _req.body.comment;

    console.log('full comment obj >>>', comment);
    console.log(`Processing comment: ${comment.id} for post: ${comment.postId}`);
    console.log(`Comment details:`, JSON.stringify({
      id: comment.id,
      postId: comment.postId,
      authorId: comment.author,
      body: comment.body.substring(0, 50) + '...',
      score: comment.score,
      permalink: comment.permalink
    }));

    // Store comment data in Redis hash and ID in sorted set GLOBALLY
    const key = 'global_comments';
    const dataKey = `comment_data:${comment.id}`;

    // Use the actual createdAt timestamp from the comment
    const timestamp = comment.createdAt;

    // Build correct Reddit URL from permalink
    const correctUrl = `https://www.reddit.com${comment.permalink}`;

    // Store detailed comment data in a hash
    const commentData = {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.author,
      body: comment.body.substring(0, 200), // Store first 200 chars
      score: comment.score.toString(),
      permalink: comment.permalink,
      createdAt: comment.createdAt.toString(),
      timestamp: timestamp.toString(),
      url: correctUrl
    };

    console.log(`Storing comment data:`, commentData);

    // Store the detailed data in a hash
    await redis.hSet(dataKey, commentData);

    // Store comment ID in sorted set for ordering (using actual createdAt)
    const result = await redis.zAdd(key, {
      member: comment.id,
      score: timestamp
    });

    console.log(`zAdd result: ${result}`);

    // Verify the data was stored
    const count = await redis.zCard(key);
    console.log(`Post-zAdd count for ${key}: ${count}`);

    res.json({
      status: 'success',
      message: 'Comment processed successfully',
      navigateTo: correctUrl,
      comment: comment.id,
      debug: {
        key,
        dataKey,
        zAddResult: result,
        postAddCount: count,
        commentData,
        correctUrl,
        originalPermalink: comment.permalink
      }
    });
  } catch (error) {
    console.error(`Error handling comment creation: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to handle comment creation',
      error: error
    });
  }
};
