import { Request, Response } from 'express';
import { redis, context, reddit } from '@devvit/web/server';
import { getFlairColorsByText } from './getFlairTemplates';

export const getCommentsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Parse pagination params
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;

    console.log(`Fetching global comments from Redis (offset: ${offset}, limit: ${limit})`);

    // Get total count
    const totalCount = await redis.zCard('global_comments');

    // Get comment IDs from Redis sorted set GLOBALLY (newest first) with pagination
    const comments = await redis.zRange('global_comments', offset, offset + limit - 1, {
      by: 'rank',
      reverse: true
    });
    const commentIds = comments.map((c: any) => c.member);

    console.log(`Found ${commentIds.length} comments out of ${totalCount} total:`, commentIds);

    // Cache for user flair data to avoid redundant API calls
    const userFlairCache = new Map<string, { text?: string | undefined; bgColor?: string | undefined; textColor?: string | undefined }>();

    // Fetch detailed data for each comment and dynamically fetch current flair
    const commentsWithData = [];
    for (const commentId of commentIds) {
      try {
        const dataKey = `comment_data:${commentId}`;
        const commentData = await redis.hGetAll(dataKey);

        if (Object.keys(commentData).length > 0) {
          // Dynamically fetch current user flair
          let userFlairText: string | undefined = undefined;
          let flairBgColor: string | undefined = undefined;
          let flairTextColor: string | undefined = undefined;

          if (commentData.authorId) {
            // Check cache first
            if (userFlairCache.has(commentData.authorId)) {
              const cached = userFlairCache.get(commentData.authorId)!;
              userFlairText = cached.text;
              flairBgColor = cached.bgColor;
              flairTextColor = cached.textColor;
            } else {
              // Fetch from API and cache
              try {
                const user = await reddit.getUserById(commentData.authorId as `t2_${string}`);
                const userFlair = await user?.getUserFlairBySubreddit(context.subredditName);

                if (userFlair?.flairText) {
                  userFlairText = userFlair.flairText;
                  const flairColors = await getFlairColorsByText(userFlair.flairText);
                  flairBgColor = flairColors.backgroundColor;
                  flairTextColor = flairColors.textColor;
                }

                // Store in cache
                userFlairCache.set(commentData.authorId, {
                  text: userFlairText,
                  bgColor: flairBgColor,
                  textColor: flairTextColor
                });
              } catch (err) {
                console.error(`Error fetching user flair for ${commentData.authorId}:`, err);
              }
            }
          }

          commentsWithData.push({
            ...commentData,
            userFlairText,
            flairBgColor,
            flairTextColor
          });
        }
      } catch (err) {
        console.error(`Error fetching data for comment ${commentId}:`, err);
      }
    }

    console.log(`Returning ${commentsWithData.length} comments with data`);

    res.json({
      status: 'success',
      subredditName: context.subredditName,
      comments: commentsWithData,
      count: commentsWithData.length,
      totalCount,
      hasMore: offset + limit < totalCount,
      offset,
      limit
    });
  } catch (error) {
    console.error(`Error fetching global comments:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch comments',
    });
  }
};
