import { Request, Response } from 'express';
import { redis, context, reddit } from '@devvit/web/server';
import { getFlairColorsByText } from './getFlairTemplates';

export const getCommentsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log(`Fetching global comments from Redis`);

    // Get comment IDs from Redis sorted set GLOBALLY (newest first)
    const comments = await redis.zRange('global_comments', 0, -1, {
      by: 'rank',
      reverse: true
    });
    const commentIds = comments.map((c: any) => c.member);

    console.log(`Found ${commentIds.length} global comments:`, commentIds);

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
            try {
              const user = await reddit.getUserById(commentData.authorId as `t2_${string}`);
              const userFlair = await user?.getUserFlairBySubreddit(context.subredditName);

              if (userFlair?.flairText) {
                userFlairText = userFlair.flairText;
                const flairColors = await getFlairColorsByText(userFlair.flairText);
                flairBgColor = flairColors.backgroundColor;
                flairTextColor = flairColors.textColor;
              }
            } catch (err) {
              console.error(`Error fetching user flair for ${commentData.authorId}:`, err);
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
      count: commentsWithData.length
    });
  } catch (error) {
    console.error(`Error fetching global comments:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch comments',
    });
  }
};
