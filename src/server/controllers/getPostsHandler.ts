import { Request, Response } from 'express';
import { redis, context, reddit } from '@devvit/web/server';
import { getFlairColorsByText } from './getFlairTemplates';

export const getPostsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log(`Fetching global posts from Redis`);

    // Get post IDs from Redis sorted set GLOBALLY (newest first)
    const posts = await redis.zRange('global_posts', 0, -1, {
      by: 'rank',
      reverse: true
    });
    const postIds = posts.map((p: any) => p.member);

    console.log(`Found ${postIds.length} global posts:`, postIds);

    // Cache for user flair data to avoid redundant API calls
    const userFlairCache = new Map<string, { text?: string | undefined; bgColor?: string | undefined; textColor?: string | undefined }>();

    // Fetch detailed data for each post and dynamically fetch current flair
    const postsWithData = [];
    for (const postId of postIds) {
      try {
        const dataKey = `post_data:${postId}`;
        const postData = await redis.hGetAll(dataKey);

        if (Object.keys(postData).length > 0) {
          // Dynamically fetch current user flair
          let userFlairText: string | undefined = undefined;
          let flairBgColor: string | undefined = undefined;
          let flairTextColor: string | undefined = undefined;

          if (postData.authorId) {
            // Check cache first
            if (userFlairCache.has(postData.authorId)) {
              const cached = userFlairCache.get(postData.authorId)!;
              userFlairText = cached.text;
              flairBgColor = cached.bgColor;
              flairTextColor = cached.textColor;
            } else {
              // Fetch from API and cache
              try {
                const user = await reddit.getUserById(postData.authorId as `t2_${string}`);
                const userFlair = await user?.getUserFlairBySubreddit(context.subredditName);

                if (userFlair?.flairText) {
                  userFlairText = userFlair.flairText;
                  const flairColors = await getFlairColorsByText(userFlair.flairText);
                  flairBgColor = flairColors.backgroundColor;
                  flairTextColor = flairColors.textColor;
                }

                // Store in cache
                userFlairCache.set(postData.authorId, {
                  text: userFlairText,
                  bgColor: flairBgColor,
                  textColor: flairTextColor
                });
              } catch (err) {
                console.error(`Error fetching user flair for ${postData.authorId}:`, err);
              }
            }
          }

          postsWithData.push({
            ...postData,
            userFlairText,
            flairBgColor,
            flairTextColor
          });
        }
      } catch (err) {
        console.error(`Error fetching data for post ${postId}:`, err);
      }
    }

    console.log(`Returning ${postsWithData.length} posts with data`);

    res.json({
      status: 'success',
      subredditName: context.subredditName,
      posts: postsWithData,
      count: postsWithData.length
    });
  } catch (error) {
    console.error(`Error fetching global posts:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch posts',
    });
  }
};
