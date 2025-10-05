import { Request, Response } from 'express';
import { context, redis, reddit } from '@devvit/web/server';
import { RedditComment } from '../../shared/types/comment';
import { PostCreateBody } from '../../shared/types/api';
import { RedditPost, PostData, PostDatRecord } from '../../shared/types/post';
import { validateUser } from '../lib/validateUser';

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



    // Store post data in Redis hash and ID in sorted set GLOBALLY
    const key = 'global_posts';
    const dataKey = `post_data:${post.id}`;
    const timestamp = post.createdAt;
    const correctUrl = `https://www.reddit.com${post.permalink}`;


    // Store detailed comment data in a hash
    const postData: PostData = {
      id: post.id,
      authorId: post.authorId,
      authorName: user.name || post.authorId,
      snoovatarImage: user.snoovatarImage,
      userProfileLink: user.url,
      title: post.title,
      body: post.selftext.substring(0, 200), // Store first 200 chars
      thumbnail: post.thumbnail,
      score: post.score.toString(),
      permalink: post.permalink,
      timestamp: timestamp.toString(),
      image: post.type == 'image' ? post.url : '',
      galleryImages: post.type == 'gallery' ? JSON.stringify(post.galleryImages) : '',
      postLink: post.type == 'link' ? post.url : ''

    };

    console.log(`Storing post data:`, postData);


    // Store the detailed data in a hash
    await redis.hSet(dataKey, postData as unknown as PostDatRecord);

    // Store comment ID in sorted set for ordering (using actual createdAt)
    const result = await redis.zAdd(key, {
      member: post.id,
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
      comment: post.id,
      debug: {
        key,
        dataKey,
        zAddResult: result,
        postAddCount: count,
        postData,
        correctUrl,
        originalPermalink: post.permalink
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
