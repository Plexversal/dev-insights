import { Request, Response } from 'express';
import { context, redis, reddit } from '@devvit/web/server';
import { RedditComment } from '../../shared/types/comment';
import { CommentCreateBody } from '../../shared/types/api';
import { CommentData, CommentDataRecord } from '../../shared/types/comment';
import { validateUser } from '../lib/validateUser';

export const postCommentCreate = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const body: CommentCreateBody = _req.body
    const comment: RedditComment = body.comment;

    // Validate user
    const validationResult = await validateUser(comment.author);

    if (!validationResult.isValid) {
      console.log(`Comment validation failed: ${validationResult.reason}`);
      res.json({
        status: 'skipped',
        message: `Comment does not match validation criteria: ${validationResult.reason}`,
        comment: comment.id
      });
      return;
    }

    console.log(`Comment validated: ${validationResult.reason}`);
    console.log('full comment obj >>>', comment);
    console.log(`Processing comment: ${comment.id} for post: ${comment.postId}`);

    const user = await reddit.getUserById(comment.author);
    if (!user) throw new Error('Failed to fetch user in postCommentCreate');

    // Store comment data in Redis hash and ID in sorted set GLOBALLY
    const key = 'global_comments';
    const dataKey = `comment_data:${comment.id}`;
    const timestamp = comment.createdAt;
    const correctUrl = `https://www.reddit.com${comment.permalink}`;
    const repliedToUser = await reddit.getUserById(body.post.authorId);


    // Store detailed comment data in a hash
    const commentData: CommentData = {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.author,
      authorName: user?.username || comment.author,
      body: comment.body.substring(0, 200), // Store first 200 chars
      score: comment.score.toString(),
      permalink: comment.permalink,
      timestamp: timestamp.toString(),
      url: correctUrl,
      repliedToUser: repliedToUser?.username || '',
      parentPostTitle: body.post.title.substring(0, 50)
    };

    console.log(`Storing comment data:`, commentData);


    // Store the detailed data in a hash
    await redis.hSet(dataKey, commentData as unknown as CommentDataRecord);

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
