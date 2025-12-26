import { Request, Response } from 'express';
import { UiResponse } from '@devvit/web/shared';
import { settings } from '@devvit/web/server';

export const postCreateHandler = async (
  _req: Request,
  res: Response<UiResponse>
): Promise<void> => {
  try {
    // Get the default title from settings to pre-populate the form
    const settingsTitle = await settings.get('postTitle');
    const defaultTitle = typeof settingsTitle === 'string' && settingsTitle.trim() !== ''
      ? settingsTitle
      : 'Official Announcements';

    res.json({
      showForm: {
        name: 'postTitleForm',
        form: {
          fields: [
            {
              type: 'string',
              name: 'title',
              label: 'Post Title',
              required: true,
              placeholder: 'Enter post title (max 300 characters)',
              defaultValue: defaultTitle,

            },
          ],
        },
        data: { title: defaultTitle },
      },
    });
  } catch (error) {
    console.error(`Error showing post title form: ${error}`);
    res.status(400).json({
      showToast: 'Failed to show post title form',
    });
  }
};
