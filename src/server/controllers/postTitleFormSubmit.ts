import { Request, Response } from 'express';
import { UiResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';

export const postTitleFormSubmit = async (
  req: Request,
  res: Response<UiResponse>
) => {
  try {
    const { title } = req.body;

    // Validate title using the same logic as validatePostTitle
    if (!title || title.trim() === '') {
      return res.json({
        showToast: 'You need at least 1 valid character for posts.',
      });
    }

    if (title.length > 300) {
      return res.json({
        showToast: 'Title too long, max 300',
      });
    }

    // Create the post with the user's custom title
    const post = await createPost(title);

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.json({
      showToast: 'Failed to create post',
    });
  }
};
