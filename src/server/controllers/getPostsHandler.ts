import { Request, Response } from 'express';
import { redis, context, reddit } from '@devvit/web/server';
import { getFlairColorsByText } from './getFlairTemplates';
import { updateOldReddit } from './postUpdateOldReddit';

export const getPostsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Parse pagination params
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 25;
    const flairFilter = req.query.flairFilter as string | undefined;
    const excludeFlair = req.query.excludeFlair === 'true';

    // console.log(`Fetching global posts from Redis (offset: ${offset}, limit: ${limit}, flairFilter: ${flairFilter}, excludeFlair: ${excludeFlair})`);

    // Get total count
    const totalCount = await redis.zCard('global_posts');

    // When filtering, we need to scan through all posts and filter them
    // We'll fetch in batches, skip the first `offset` filtered results, then return `limit` results
    let allFilteredPosts: any[] = [];
    let skippedFilteredCount = 0; // Count of filtered posts we've skipped
    let redisOffset = 0;
    const batchSize = 50; // Fetch posts in batches
    let hasMoreToFetch = true;

    // Cache for user flair data to avoid redundant API calls
    const userFlairCache = new Map<string, { text?: string | undefined; bgColor?: string | undefined; textColor?: string | undefined }>();

    while (hasMoreToFetch && redisOffset < totalCount) {
      // Get post IDs from Redis sorted set GLOBALLY (newest first) with pagination
      const posts = await redis.zRange('global_posts', redisOffset, redisOffset + batchSize - 1, {
        by: 'rank',
        reverse: true
      });

      if (posts.length === 0) {
        hasMoreToFetch = false;
        break;
      }

      const postIds = posts.map((p: any) => p.member);

      // Fetch detailed data for each post in this batch
      for (const postId of postIds) {

        try {
          const dataKey = `post_data:${postId}`;
          const postData = await redis.hGetAll(dataKey);

          if (Object.keys(postData).length > 0) {
            // Apply flair filter if specified
            let passesFilter = true;
            if (flairFilter) {
              const postFlairText = (postData.postFlairText || '').toLowerCase();
              const postFlairTemplateId = postData.postFlairTemplateId || '';
              const filterLower = flairFilter.toLowerCase();

              // Check if either the text (case-insensitive) or template ID matches
              const matches = postFlairText === filterLower || postFlairTemplateId === flairFilter;
              // Skip if excludeFlair and matches, or if !excludeFlair and doesn't match
              if (excludeFlair && matches) {
                passesFilter = false;
              } else if (!excludeFlair && !matches) {
                passesFilter = false;
              }
            }

            if (!passesFilter) {
              continue; // Skip this post, doesn't match filter
            }

            // This post passed the filter
            // Check if we should skip it (for pagination offset)
            if (skippedFilteredCount < offset) {
              skippedFilteredCount++;
              continue;
            }

            // Check if we have enough posts for this page
            if (allFilteredPosts.length >= limit) {
              // We have enough posts, but continue to check if there are more
              hasMoreToFetch = true;
              break;
            }

            // Dynamically fetch current user flair
            let userFlairText: string | undefined = undefined;
            let flairBgColor: string | undefined = undefined;
            let flairTextColor: string | undefined = undefined;

            if (postData.authorId) {
              // Check cache first
              if (userFlairCache.has(postData.authorId)) {
                const cached = userFlairCache.get(postData.authorId)!;
                userFlairText = cached.text;
                flairBgColor = cached.bgColor;
                flairTextColor = cached.textColor;
              } else {
                // Fetch from API and cache
                try {
                  const user = await reddit.getUserById(postData.authorId as `t2_${string}`);
                  const userFlair = await user?.getUserFlairBySubreddit(context.subredditName);

                  if (userFlair?.flairText) {
                    userFlairText = userFlair.flairText;
                    const flairColors = await getFlairColorsByText(userFlair.flairText);
                    flairBgColor = flairColors.backgroundColor;
                    flairTextColor = flairColors.textColor;
                  }
                } catch (err) {
                  console.error(`Error fetching user flair for ${postData.authorId}:`, err);
                  // Cache will store undefined values to prevent retrying
                } finally {
                  // Always cache the result (even if undefined) to avoid retrying failed requests
                  userFlairCache.set(postData.authorId, {
                    text: userFlairText,
                    bgColor: flairBgColor,
                    textColor: flairTextColor
                  });
                }
              }
            }

            allFilteredPosts.push({
              ...postData,
              userFlairText,
              flairBgColor,
              flairTextColor
            });
          }
        } catch (err) {
          console.error(`Error fetching data for post ${postId}:`, err);
        }
      }

      // If we have enough posts, stop fetching
      if (allFilteredPosts.length >= limit) {
        break;
      }

      // Move offset forward for next batch
      redisOffset += batchSize;
    }

    const postsWithData = allFilteredPosts;

    // console.log(`Returning ${postsWithData.length} posts with data`);

    // Determine if there are more filtered posts available
    // If we fetched exactly our limit and haven't reached the end of Redis, there might be more
    const hasMore = postsWithData.length === limit && redisOffset < totalCount;

    // Update old Reddit fallback text (with rate limiting)
    updateOldReddit().catch(err => {
      console.error('[getPostsHandler] Error updating old Reddit fallback:', err);
    });

    res.json({
      status: 'success',
      subredditName: context.subredditName,
      posts: postsWithData,
      count: postsWithData.length,
      totalCount, // This is total in Redis, not filtered count
      hasMore,
      offset,
      limit
    });
  } catch (error) {
    console.error(`Error fetching global posts:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch posts',
    });
  }
};
