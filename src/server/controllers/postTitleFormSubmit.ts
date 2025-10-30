import { Request, Response } from 'express';
import { UiResponse } from '@devvit/web/shared';
import { context, reddit } from '@devvit/web/server';
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
    const post = await createPost(title)

    // unsticky code - not sure if i should keep this or not, needs to be done before additional mod actions but only applies when post created in this file due to manual creation

    // if (post.id) {
    //   try {
    //     let hot = await reddit.getHotPosts({
    //       subredditName: context.subredditName,
    //       limit: 5,
    //       pageSize: 1,
    //     });
    //     let resolvedHot = await hot.all();
    //     resolvedHot.forEach(async post => {
    //       if(post.authorName == context.appName) {
    //         await post.unsticky();
    //       }
    //     })
    //   } catch (err) {
    //     console.error(`failed to unsticky existing stuck posts`, err)
    //   }
    // }


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
