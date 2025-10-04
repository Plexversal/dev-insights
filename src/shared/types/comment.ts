// Reddit Comment object structure based on actual webhook payload
export interface RedditComment {
  id: string;                              // e.g., 't1_ngpko91'
  parentId: string;                        // e.g., 't3_1nsx56d' (post) or 't1_xxx' (comment)
  body: string;                            // Comment text content
  author: `t2_${string}`;                  // Author ID e.g., 't2_8fuxfbi'
  numReports: number;                      // Number of reports
  collapsedBecauseCrowdControl: boolean;   // Crowd control status
  spam: boolean;                           // Is spam
  deleted: boolean;                        // Is deleted
  createdAt: number;                       // Unix timestamp in milliseconds
  upvotes: number;                         // Upvote count
  downvotes: number;                       // Downvote count
  languageCode: string;                    // Language code
  lastModifiedAt: number;                  // Last modified timestamp (-1 if not modified)
  gilded: boolean;                         // Has gold/awards
  score: number;                           // Net score (upvotes - downvotes)
  permalink: string;                       // Reddit permalink e.g., '/r/subreddit/comments/postId/comment/commentId'
  hasMedia: boolean;                       // Contains media
  postId: string;                          // Parent post ID e.g., 't3_1nsx56d'
  subredditId: string;                     // Subreddit ID e.g., 't5_fj7j6c'
  elementTypes: string[];                  // Content element types e.g., ['text']
  mediaUrls: string[];                     // Media URLs
}

// Simplified comment data for storage/display
export interface CommentData {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  body: string;
  score: number;
  permalink: string;
  timestamp: string;
  url: string;
}