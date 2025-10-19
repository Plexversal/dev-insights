import { Request, Response } from 'express';
import { settings } from '@devvit/web/server';

export const getCustomLabels = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch all three settings
    const [postsButtonName, commentsButtonName, bottomSubtitle] = await Promise.all([
      settings.get('postsButtonName'),
      settings.get('commentsButtonName'),
      settings.get('bottomSubtitle')
    ]);

    // Use default values if settings are not configured
    const postsLabel = typeof postsButtonName === 'string' && postsButtonName.trim() !== ''
      ? postsButtonName
      : 'Announcements';

    const commentsLabel = typeof commentsButtonName === 'string' && commentsButtonName.trim() !== ''
      ? commentsButtonName
      : 'Official Replies';

    const subtitle = typeof bottomSubtitle === 'string' && bottomSubtitle.trim() !== ''
      ? bottomSubtitle
      : 'Official Replies';

    res.json({
      postsButtonName: postsLabel,
      commentsButtonName: commentsLabel,
      bottomSubtitle: subtitle,
    });
  } catch (error) {
    console.error(`Error fetching custom labels: ${error}`);
    // Return default values in case of error
    res.json({
      postsButtonName: 'Announcements',
      commentsButtonName: 'Official Replies',
      bottomSubtitle: 'Official Replies',
    });
  }
};
