import { Request, Response } from 'express';
import { context, redis, reddit } from '@devvit/web/server';
import { RedditComment } from '../../shared/types/comment';
import { CommentCreateBody } from '../../shared/types/api';
import { validateUser } from '../lib/validateUser';
import { addCommentToDb } from '../lib/addCommentToDb';

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

    const repliedToUser = await reddit.getUserById(body.post.authorId);
    const correctUrl = `https://www.reddit.com${comment.permalink}`;

    // Add comment to database using lib function
    const dbResult = await addCommentToDb(
      comment,
      user?.username || comment.author,
      repliedToUser?.username || '',
      body.post.title
    );

    if (!dbResult.success) {
      res.json({
        status: 'skipped',
        message: dbResult.error || 'Failed to add comment to database',
        comment: comment.id
      });
      return;
    }

    res.json({
      status: 'success',
      message: 'Comment processed successfully',
      navigateTo: correctUrl,
      comment: comment.id
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
