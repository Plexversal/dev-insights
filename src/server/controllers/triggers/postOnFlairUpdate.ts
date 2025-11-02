import { Request, Response } from 'express';
import { context, redis, reddit, settings } from '@devvit/web/server';
import { PostCreateBody } from '../../../shared/types/api';
import { RedditPost } from '../../../shared/types/post';
import { validatePostFlair } from '../../lib/validatePostFlair';
import { validateUser } from '../../lib/validateUser';
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

    const dependantFlairMatches = await settings.get('dependantFlairMatches') as boolean;

    // Validate user and post flair
    const [userValidationResult, postValidationResult] = await Promise.all([
      validateUser(post.authorId),
      validatePostFlair(post.linkFlair),
    ]);

    // Check validation based on dependant setting
    let shouldSkip = false;
    let skipReason = '';
    console.log(userValidationResult, postValidationResult)

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

    // Check if post already exists in database
    const dataKey = `post_data:${post.id}`;
    const postExists = await redis.exists(dataKey);

    if (postExists) {
      // Post exists - check if validation still passes
      if (shouldSkip) {
        // Post no longer matches criteria after flair update - remove it
        await redis.del(dataKey);
        await redis.zRem('global_posts', [post.id]);

        res.json({
          status: 'removed',
          message: `Post removed from app: ${skipReason}`,
          post: post.id,
        });
        return;
      }

      // Post still matches - update the flair text and template ID in database
      console.log('updating with flair:', post.linkFlair?.templateId)
      await redis.hSet(dataKey, {
        postFlairText: post.linkFlair?.text || '',
        postFlairTemplateId: post.linkFlair?.templateId || ''
      });

      res.json({
        status: 'updated',
        message: 'Post flair updated successfully in database',
        post: post.id
      });
      return;
    }

    // Post doesn't exist yet
    if (shouldSkip) {
      res.json({
        status: 'skipped',
        message: `Post does not match validation criteria: ${skipReason}`,
        post: post.id,
      });
      return;
    }

    // Add new post to database using lib function
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
      message: 'Post added successfully after flair update',
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
