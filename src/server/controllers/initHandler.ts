import { Request, Response } from 'express';
import { InitResponse } from '../../shared/types/api';
import { redis, reddit, context } from '@devvit/web/server';

export const initHandler = async (
  _req: Request,
  res: Response<InitResponse | { status: string; message: string }>
): Promise<void> => {
  const { postId } = context;

  if (!postId) {
    console.error('API Init Error: postId not found in devvit context');
    res.status(400).json({
      status: 'error',
      message: 'postId is required but missing from context',
    });
    return;
  }

  try {

      try {
        let allFlairs = await reddit.getUserFlairTemplates(context.subredditName)
        let detailedFlairs = allFlairs.map((e: any) => ({
          id: e.id,
          text: e.text,
          textColor: e.textColor,
          backgroundColor: e.backgroundColor,
          allowableContent: e.allowableContent,
          modOnly: e.modOnly,
          maxEmojis: e.maxEmojis,
          allowUserEdits: e.allowUserEdits
        }))
        let styles = await reddit.getSubredditStyles(context.subredditId)

        console.log(detailedFlairs, styles)
      } catch (e) {
        console.log(e)
      }

    const [count, username, comment] = await Promise.all([
      redis.get('count'),
      reddit.getCurrentUsername(),
      (await reddit.getCommentById('t1_ng5vb6a')).body,
    ]);

    res.json({
      type: 'init',
      postId: postId,
      count: count ? parseInt(count) : 0,
      username: username ?? 'anonymous',
      comment: comment ?? ''
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    let errorMessage = 'Unknown error during initialization';
    if (error instanceof Error) {
      errorMessage = `Initialization failed: ${error.message}`;
    }
    res.status(400).json({ status: 'error', message: errorMessage });
  }
};
