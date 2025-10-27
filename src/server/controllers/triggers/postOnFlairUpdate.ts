import { Request, Response } from 'express';
import { context, redis, reddit, settings } from '@devvit/web/server';
import { PostCreateBody } from '../../../shared/types/api';
import { RedditPost } from '../../../shared/types/post';
import { validatePostFlair } from '../../lib/validatePostFlair';
import { addPostToDb } from '../../lib/addPostToDb';

export const postOnFlairUpdate = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const body: PostCreateBody = _req.body
    const post: RedditPost = body.post;
    const user = body.author

    if (!user) throw new Error('Failed to fetch user in postOnFlairUpdate');

    // Validate post flair
    const postValidationResult = await validatePostFlair(post.linkFlair);

    if (!postValidationResult.isValid) {
      res.json({
        status: 'skipped',
        message: `Post flair does not match validation criteria: ${postValidationResult.reason}`,
        post: post.id,
      });
      return;
    }

    // Add post to database using lib function
    const dbResult = await addPostToDb(
      post,
      user.name,
      user.snoovatarImage,
      user.url
    );

    if (!dbResult.success) {
      res.json({
        status: 'skipped',
        message: dbResult.error || 'Failed to add post to database',
        post: post.id
      });
      return;
    }

    const correctUrl = `https://www.reddit.com${post.permalink}`;

    res.json({
      status: 'success',
      message: 'Post processed successfully after flair update',
      navigateTo: correctUrl,
      post: post.id
    });
  } catch (error) {
    console.error(`Error handling flair update: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to handle flair update',
      error: error
    });
  }
};
