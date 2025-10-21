## What is Dev-Insights?

Dev-Insights is a post-based app built with Reddit's Devvit library. It's purpose is to provide users better insight into comments and posts made by Developers, Content Creators, Community Figures and more so they are not lost and key information is readily available without the user needing to do extensive searching. 

Comments can also get lost over time once the posts age past a couple of days and a dev comment may be extremely valuable for the community as a whole.

<!-- <img width="875" height="640" alt="lightmode" src="https://github.com/user-attachments/assets/e443757e-28a7-4663-86a6-d486a66e6e4b" /> -->

![](https://github.com/user-attachments/assets/e443757e-28a7-4663-86a6-d486a66e6e4b)

## 🔥 Key features

* Track comments and posts from any of `flair text`, `flair css class`, and/or `users`. (You can match all 3 if you like!)
* Infinite history of comments and posts - No more 6 pin highlights limit!
* Backdate pinning items for users specified in the app config.
* Automatic updates for edits/deletions for posts and comments.
* Manually add any posts or comments to the App using mod-action button on the item.
* Supports `includes` in flair text, e.g. "dev" will match "Developer" in a flair. Matching is NOT case sensitive.
* Automatic light/dark theme.
* Moderators can remove comments and posts from the App at any time.
* Supports showing user flair in the App Post itself (beta*).

\* *Reddit does not support fetching a users exact flair and so it is based on a guess with their flair text. If you find the app is showing the wrong flair, please report it to me directly u/PlexversalHD.*

#### **Example r/Battlefield, uses for all game dev announcements**

<!-- <img width="900" height="715" alt="BF-IMG" src="https://github.com/user-attachments/assets/7f326365-6eea-4214-af6d-ad740189bc4f" /> -->

![](https://github.com/user-attachments/assets/7f326365-6eea-4214-af6d-ad740189bc4f)

#### **Commment view as Mod** - all mods can remove content from the post if required

<!-- <img width="899" height="710" alt="Apex-comments" src="https://github.com/user-attachments/assets/d20610a8-6b91-4ce3-84e0-85ebe92adea8" /> -->

![](https://github.com/user-attachments/assets/d20610a8-6b91-4ce3-84e0-85ebe92adea8)



## ⬇️ How to install

1. Click `+ Add to this community` from the [App page](https://developers.reddit.com/apps/dev-insights) (if not already here)
2. Select your subreddit
3. Configure the Flair text, users and flair css classes to match in [My Communities](https://developers.reddit.com/my/communities) > Click your subreddit you just added it to > Dev Insights (Settings) > Configure at least one option here for it to work.
4. Optional: If you specified any `users` in the step above then you can use the fetch posts menu option: Navigate to your subreddit > click `•••` > Fetch previous user content. (does not apply to flair)
5. That's it!

### ⚠️ Warning!

If matching flair text, ensure you are specific enough as to not match another generic flair. It will be included in any word/text. E.g. if you configure it to match `dev` it will match `developer` but also words like `device`, `devious` etc. The other matches for users and css class are not like this and are exact.

## 🗒️ Things to note

* The app does not automatically get previous dev comments, BUT if you specified any `users` in the app config from step 3 above, it will try fetch the last 30 comments/posts for that user and then populate the app if they were made in the subreddit.
* Matching config options are independent from each other, so if you put something in all 3 options then a user which matches any of the options will be a match. It will match in order of users, flair text and then flair css class.
* As mentioned before flair may be visually wrong in the app, this may happen if you have duplicate flair text, please report if you see issues.

## 🖊️ Patch notes

### v0.0.16

* Minor bug fixes.
* Additional Reddit development compliance.

### V0.0.15

* Implemented new settings based on user feedback:
  * Added `Default Post Title` setting for post title + Title can also be changed when creating a new post manually.
  * Added `Posts Tab Button Name` setting, default value is **Announcements**.
  * Added `Comments Tab Button Name` setting, default value is **Official Replies**.
  * Added `Bottom Subtitle` setting, default value is **Recent Announcements**.
* Fixed an issue with low quality preview images, it will now try and fetch the actual post image first, then fetch the lower quality thumbnail if main image not available. (It was the other way around previously).
* Fixed an issue with white background clipping on dark mode.


### V0.0.14

* Based on user feedback it was apparent the App may not have properly explained it's purpose and so a whole new redesign has been implemented. Thanks to u/Xenc for the inspiration and tips! Below are the changes:
  * Separated posts and comments into their own tabs.
  * Button names/subtitles are more appropriate: `Posts > Announcements`, `Comments > Official Replies`.
  * Default title changed from `Community Figure Insights > Game Announcements`.
  * Removed text from Posts as it was too overwhelming, now only showing post titles.
  * Scrolling to see more posts/comments is more uniform and shows a set amount of posts/comments per page depending on if user is on mobile/desktop.
  * Color scheme is more uniform with darker/lighter accents only. (In the future, color scheme settings will be available in App settings to change this).
* Posts on Install will auto lock and a sticky comment provided to show the purpose of the App Post.

### V0.0.13
* Added support for old reddit, showing the last 25 Official posts. Updates automatically.
