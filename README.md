## What is Dev-Insights?

Dev-Insights is a post-based app built with Reddit's Devvit library. It's purpose is to provide users better insight into comments and posts made by Developers, Content Creators, Community Figures and more so they are not lost and key information is readily available without the user needing to do extensive searching. 

Comments can also get lost over time once the posts age past a couple of days and a dev comment may be extremely valuable for the community as a whole.

![](https://i.redd.it/sqssokjoglwf1.png)

## 🔥 Key features

* Track comments and posts from any of `flair text`, `flair css class`, `post flair`, and/or `users`. (You can match multiple options!)
* **Separate tab feature** - Create a third tab to organize posts with a specific post flair separately from other posts.
* Infinite history of comments and posts - No more 6 pin highlights limit!
* Backdate pinning items for users specified in the app config.
* Automatic updates for edits/deletions for posts and comments.
* Manually add any posts or comments to the App using mod-action button on the item.
* Supports `includes` in flair text (both user and post flair), e.g. "dev" will match "Developer" in a flair. Matching is NOT case sensitive.
* Post flair matching supports both flair text and template ID.
* Bottom subtitle supports clickable markdown links to reddit, x.com, or twitter.com.
* Automatic light/dark theme.
* Moderators can remove comments and posts from the App at any time.
* Supports showing user flair in the App Post itself (beta*).

\* *Reddit does not support fetching a users exact flair and so it is based on a guess with their flair text. If you find the app is showing the wrong flair, please report it to me directly u/PlexversalHD.*

#### **Example r/Battlefield, uses for all game dev announcements**

![](https://i.redd.it/zgody49rglwf1.png)

#### **Comment view as Mod** - all mods can remove content from the post if required

![](https://i.redd.it/bhr9cl5uglwf1.png)


## ⬇️ How to install

1. Click `+ Add to this community` from the [App page](https://developers.reddit.com/apps/dev-insights) (if not already here)
2. Select your subreddit
3. Configure the Flair text, users and flair css classes to match in [My Communities](https://developers.reddit.com/my/communities) > Click your subreddit you just added it to > Dev Insights (Settings) > Configure at least one option here for it to work.
4. Optional: If you specified any `users` in the step above then you can use the fetch posts menu option: Navigate to your subreddit > click `•••` > Fetch previous user content. (does not apply to flair)
5. That's it!

### ⚠️ Warning!

If matching flair text (both user flair and post flair), ensure you are specific enough as to not match another generic flair. It will be included in any word/text. E.g. if you configure it to match `dev` it will match `developer` but also words like `device`, `devious` etc. The matches for users and css class are exact, but flair text uses `includes` matching for better flexibility.

## 🗒️ Things to note

* The app does not automatically get previous dev comments, BUT if you specified any `users` in the app config from step 3 above, it will try fetch the last 30 comments/posts for that user and then populate the app if they were made in the subreddit.
* Matching config options are independent from each other, so if you put something in all 3 options then a user which matches any of the options will be a match. It will match in order of users, flair text and then flair css class. Post flair has an option to make it dependant on users, so this is the only dependant setting available.
* As mentioned before flair may be visually wrong in the app, this may happen if you have duplicate flair text or do not specify exact flair text, please report if you see issues.

## 🏆 Early supporters 
Any sub that installed and used this app in 2025 will be classed as an early supporter. Thank you to the below Subreddits for their early feedback and install:

* **[r/Battlefield](https://www.reddit.com/r/Battlefield)**
* **[r/Battlefield6](https://www.reddit.com/r/Battlefield6)**
* **[r/Battlefield_REDSEC](https://www.reddit.com/r/Battlefield_REDSEC/)**
* **[r/Minecraft](https://www.reddit.com/r/Minecraft/)**
* **[r/gwent](https://www.reddit.com/r/gwent/)**
* **[r/ApexLegends](https://www.reddit.com/r/ApexLegends)**
* **[r/TheWeeknd](https://www.reddit.com/r/TheWeeknd/)**

## 🖊️ Patch notes

### v0.0.21

* Added custom app icon for better branding and visual identity.
* Improved error handling across various features for better reliability.
* General bug fixes and performance improvements.

### v0.0.20

* Bug fixes relating to separate posts tab loading and separation logic
* Fixed an issue with username displayed in app being incorrect when post flair changes. 
* Other small bug fixes.

### v0.0.19

* **New Separate Tab Feature:**
  * Added `Separate Posts Tab for a specific post flair` setting that allows creating a dedicated third tab for posts with a specific post flair.
  * Format: `[Tab Button Name](exact flair text OR template ID)` where tab name is max 30 characters and flair identifier is max 64 characters.
  * Example: `[Official News](Announcement)` or `[Esports](12ff3a4-66a7ff77-44f4f)`.
  * When configured, posts matching the specified flair will **only** appear in the separate tab, while all other posts appear in the default posts tab.
  * Works with both **flair text** (exact match) and **flair template ID** for maximum flexibility.
  * The separate tab appears between the default posts tab and the comments tab.
  * Supports **real-time flair updates** - if a post's flair changes, it automatically moves to the correct tab.
  * Leave blank to keep all posts in one tab (default behavior).

* **Improved User Flair Display:**
  * Fixed visual overflow issues where long user flair text would push usernames out of view or overflow the container.
  * Username and flair now properly share space within the container - username can use remaining space while flair is capped at 50% width maximum.
  * Both username and flair will truncate with ellipsis (...) when too long, ensuring nothing overflows the container.
  * Flair stays directly next to the username (left-aligned) instead of being pushed to the right when there's available space.
  * Applied to both post cards and comment cards for consistent display.

* **Database Enhancements:**
  * All posts now store both `postFlairText` and `postFlairTemplateId` for better flair matching capabilities.
  * Any post flair changes on an existing post will redo checks to see if there is a match. E.g. you forgot to flair a post after creating but flairing after now matches the `Post Flair` match in your settings.


### v0.0.18

* **New Post Flair Matching Feature:**
  * Added `Match Post Flair Text or ID` setting that allows matching posts by their post flair.
  * Supports matching by **flair text** (using includes, not exact match) or **flair template ID**.
  * Example: "News" will match posts with flair text containing "Official News", or you can use the exact flair ID like "12ff3a4-66a7ff77-44f4f".
  * **STRONGLY advised** to use mod-only post flairs to prevent abuse.
  * **Note:** Flair text matching uses `includes` rather than exact matching for better flexibility. However, some matching issues may still occur if flair text is too generic. Be as specific as possible.

* **Enhanced Bottom Subtitle Setting:**
  * The `Bottom Subtitle` setting now supports **markdown links** in addition to plain text.
  * Can use format `[text](url)` where text is max 30 characters and URL is max 1000 characters.
  * **Domain restrictions:** Only `*.reddit.com`, `x.com`, or `twitter.com` domains are allowed for security.
  * Examples:
    * Plain text: `Recent Announcements`
    * Markdown link: `[Visit Our Updates](https://reddit.com/r/example)`
  * Links will appear as clickable blue text in the app footer.

* **Improved Flair Color Matching:**
  * User flair color matching now uses `includes` instead of exact matching for better accuracy.
  * This improves the visual display of user flairs in the app, though some edge cases may still occur with duplicate or similar flair text.

* Added setting to disable comments tab entirely for subreddits that only want to display posts.
* Media handling improvements for text posts that contain embedded images.


### v0.0.17

* Minor bug fixes + readme

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
