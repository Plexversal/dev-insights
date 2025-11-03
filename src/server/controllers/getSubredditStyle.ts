import { Request, Response } from 'express';
import { context, reddit, settings } from '@devvit/web/server';

export const getSubredditStyle = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch all three settings
    const [postsButtonName] = await Promise.all([
      settings.get('postsButtonName'),
    ]);

    const subSettings = (await reddit.getCurrentSubreddit()).settings
    const stylesCSS = await reddit.getSubredditStyles(context.subredditId)
    const style = {
      primaryColor: stylesCSS.backgroundColor,
      secondaryColor: subSettings.primaryColor // this is the KEY color which makes no sense
    }

    res.json({
      style: style,

    });
  } catch (error) {
    console.error(`Error fetching subreddit style: ${error}`);
    // Return default values in case of error
    res.json(null);
  }
};
