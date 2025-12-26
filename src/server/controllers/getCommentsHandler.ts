import { Request, Response } from 'express';
import { redis, context, reddit, cache } from '@devvit/web/server';
import { getFlairColorsByText } from './getFlairTemplates';

export const getCommentsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Parse pagination params
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;

    const cacheKey = `comments_${offset}_${limit}`;

    const data = await cache(
      async () => {
        // Get total count
        const totalCount = await redis.zCard('global_comments');

        // Get comment IDs from Redis sorted set GLOBALLY (newest first) with pagination
        const comments = await redis.zRange('global_comments', offset, offset + limit - 1, {
          by: 'rank',
          reverse: true
        });
        const commentIds = comments.map((c: any) => c.member);

        // console.log(`Found ${commentIds.length} comments out of ${totalCount} total:`, commentIds);

        // Cache for user flair data to avoid redundant API calls
        const userFlairCache = new Map<string, { text: string | null; bgColor: string | null; textColor: string | null }>();

        // Fetch detailed data for each comment and dynamically fetch current flair
        const commentsWithData = [];
        for (const commentId of commentIds) {
          try {
            const dataKey = `comment_data:${commentId}`;
            const commentData = await redis.hGetAll(dataKey);

            if (Object.keys(commentData).length > 0) {
              // Dynamically fetch current user flair
              let userFlairText: string | null = null;
              let flairBgColor: string | null = null;
              let flairTextColor: string | null = null;

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
                      // if(process.env.environment == 'DEV') console.log(userFlair)
                      const flairColors = await getFlairColorsByText(userFlair.flairText);
                      flairBgColor = flairColors.backgroundColor ?? null;
                      flairTextColor = flairColors.textColor ?? null;
                    }
                  } catch (err) {
                    console.error(`Error fetching user flair for ${commentData.authorId}:`, err);
                    // Cache will store undefined values to prevent retrying
                  } finally {
                    // Always cache the result (even if undefined) to avoid retrying failed requests
                    userFlairCache.set(commentData.authorId, {
                      text: userFlairText,
                      bgColor: flairBgColor,
                      textColor: flairTextColor
                    });
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

        // console.log(`Returning ${commentsWithData.length} comments with data`);

        return {
          status: 'success',
          subredditName: context.subredditName,
          comments: commentsWithData,
          count: commentsWithData.length,
          totalCount,
          hasMore: offset + limit < totalCount,
          offset,
          limit
        };
      },
      {
        key: cacheKey,
        ttl: 120 // 2 minutes
      }
    );

    res.json(data);
  } catch (error) {
    console.error(`Error fetching global comments:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch comments',
    });
  }
};
