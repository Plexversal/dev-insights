import { Request, Response } from 'express';
import { redis, context } from '@devvit/web/server';

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
    const commentIds = comments.map(c => c.member);

    console.log(`Found ${commentIds.length} global comments:`, commentIds);

    // Fetch detailed data for each comment
    const commentsWithData = [];
    for (const commentId of commentIds) {
      try {
        const dataKey = `comment_data:${commentId}`;
        const commentData = await redis.hGetAll(dataKey);

        if (Object.keys(commentData).length > 0) {
          commentsWithData.push({
            id: commentId,
            postId: commentData.postId || '',
            authorId: commentData.authorId || 'unknown',
            authorName: commentData.authorId || 'Unknown', // We'll display the authorId for now
            url: commentData.url || `https://reddit.com/comments/${commentId.replace('t1_', '')}`,
            body: commentData.body || 'No content available',
            score: parseInt(commentData.score || '0') || 0,
            permalink: commentData.permalink || '',
            timestamp: commentData.timestamp || Date.now().toString()
          });
        } else {
          // Fallback if no detailed data found
          commentsWithData.push({
            id: commentId,
            postId: '',
            authorId: 'unknown',
            authorName: 'Unknown',
            url: `https://reddit.com/comments/${commentId.replace('t1_', '')}`,
            body: 'Comment data not available',
            score: 0,
            permalink: '',
            timestamp: Date.now().toString()
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
