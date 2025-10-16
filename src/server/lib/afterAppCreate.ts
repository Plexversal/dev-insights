
import { context, Post } from '@devvit/web/server';

export default async function afterAppCreate(post: Post) {
    await post.addComment({
      runAs: 'APP',
      text: `This post shows a collection of most recent comments and posts made by the game devs. This is made using Reddits new Devvit App experience.\nFor the best experience, make sure you are using the modern Reddit rather than old. Old reddit will still show post links.\nIf you encounter any issues with loading or have a feature request, feel free to click "report an issue" within this app post.\n### If you want to hide the post:\nYou can hide the post by clicking the 3 \`•••\` at the top right of the post > Hide.`
    })
    await post.sticky();
    await post.lock();
}
