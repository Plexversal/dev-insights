import { Request, Response } from 'express';
import { context, redis, reddit } from '@devvit/web/server';
import { PostCreateBody } from '../../shared/types/api';
import { RedditPost } from '../../shared/types/post';
import { validateUser } from '../lib/validateUser';
import { addPostToDb } from '../lib/addPostToDb';

export const postPostCreate = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const body: PostCreateBody = _req.body
    const post: RedditPost = body.post;
    const user = body.author
    if (!user) throw new Error('Failed to fetch user in postPostCreate');

    console.log(body)
    // Validate user
    const validationResult = await validateUser(post.authorId);

    if (!validationResult.isValid) {
      console.log(`Post validation failed: ${validationResult.reason}`);
      res.json({
        status: 'skipped',
        message: `Post does not match validation criteria: ${validationResult.reason}`,
        post: post.id
      });
      return;
    }

    console.log(`Post validated: ${validationResult.reason}`);
    console.log(`Processing post: ${post.id}`);

    // Add post to database using lib function
    const dbResult = await addPostToDb(
      post,
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
      message: 'Post processed successfully',
      navigateTo: correctUrl,
      post: post.id
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
