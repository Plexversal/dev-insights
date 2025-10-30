import { Request, Response } from 'express';
import { context, redis, reddit, settings } from '@devvit/web/server';
import { PostCreateBody } from '../../../shared/types/api';
import { RedditPost } from '../../../shared/types/post';
import { validateUser } from '../../lib/validateUser';
import { addPostToDb } from '../../lib/addPostToDb';
import { validatePostFlair } from '../../lib/validatePostFlair';

export const postPostCreate = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const body: PostCreateBody = _req.body
    const post: RedditPost = body.post;
    const user = body.author
    if (!user) throw new Error('Failed to fetch user in postPostCreate');
    const dependantFlairMatches = await settings.get('dependantFlairMatches') as boolean;
    // console.log(body)
    // Validate user
    const [userValidationResult, postValidationResult] = await Promise.all([
      validateUser(post.authorId),
      validatePostFlair(post.linkFlair),
    ]);

    // Check validation based on dependant setting
    let shouldSkip = false;
    let skipReason = '';

    if (dependantFlairMatches) {
      // Both user AND post flair must match
      if (!userValidationResult.isValid || !postValidationResult.isValid) {
        shouldSkip = true;
        skipReason = !userValidationResult.isValid
          ? userValidationResult.reason || 'User validation failed'
          : postValidationResult.reason || 'Post flair validation failed';
      }
    } else {
      // Either user OR post flair must match (default behavior)
      if (!userValidationResult.isValid && !postValidationResult.isValid) {
        shouldSkip = true;
        skipReason = `Neither user nor post flair matched: ${userValidationResult.reason || 'unknown'}, ${postValidationResult.reason || 'unknown'}`;
      }
    }

    if (shouldSkip) {
      res.json({
        status: 'skipped',
        message: `Post does not match validation criteria: ${skipReason}`,
        post: post.id,
      });
      return;
    }

    // console.log(`Post validated: ${validationResult.reason}`);
    // console.log(`Processing post: ${post.id}`);

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
