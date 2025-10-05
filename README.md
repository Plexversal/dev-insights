## What is Dev-Insights?

Dev-Insights is a post-based app built with Reddit's Devvit library. It's purpose is to provide users better insight into comments and posts made by Developers, Youtubers, Community Figures and more so they are not lost and key information is readily available without the user needing to do extensive searching. 

Comments can also get lost over time once the posts age past a couple of days and a dev comment may be extremely valuable for the community as a whole.

It is advisable you pin/add to highlights the post after install which will put it in the second slot on your subreddit for users to see the full application.

## 🔥 Key features

* Track comments and posts from any of `flair text`, `flair css class`, and/or `users`. (You can match all 3 if you like!)
* Automatic edits/deletions for posts and comments.
* Supports `includes` in flair text, e.g. "dev" will match "Devleoper" in a flair. Matching is NOT case sensitive.
* Automatic light/dark theme.
* Supports showing user flair in the App Post iself (beta*).
* Moderators can remove comments and posts from the App at any time.

\* *Reddit does not support fetching a users exact flair and so it is based on a guess with their flair text. If you find the app is showing the wrong flair, you can disable showing user flairs in the App settings for your subreddit, pictured below.*

## ⬇️ How to install

1. Click `+ Add to this communuity` from the [App page](https://developers.reddit.com/apps/dev-insights) (if not already here)
2. Select your subreddit
3. Once added Navigate to your subreddit > click `•••` > Create a new post (this is a **new** option provided by the app)
4. Click Mod Shield on the new post > Add to Highlights. This will add it under the highlights as its own large post.
5. Configure the Flair text, users and flair css classes to match in [My Communities](https://developers.reddit.com/my/communities) > Click your subreddit you just added it to > Dev Insights (Settings) > Configure at least one option here for it to work.
6. That's it!

### ⚠️ Warning!

If matching flair text, ensure you are specific enough as to not match another generic flair. It will be included in any word/text. E.g. if you configure it to match `dev` it will match `developer` but also words like `device`, `devious` etc. The other matches for users and css class are not like this and are exact.

## 🗒️ Things to note

* The app does not automatically get previous dev comments, BUT if you specified any `users` in the app config from step 5 above, it will try fetch the last 50 comments/posts for that user in the subreddit and then populate the app after that.
* Matching config options are independant from each other, so if you put something in all 3 options then a user which matches any of the options will be a match. It will match in order of users, flair text and then flair css class.
* As mentioned before flair may be visually wrong in the app, this may happen if you have duplicate flair text, you can disable this in App settings if you see issues.
