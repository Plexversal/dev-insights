export interface RedditPost {
  id: `t3_${string}`;
  title: string;
  selftext: string;
  nsfw: boolean;
  authorId: `t2_${string}`;
  crowdControlLevel: number;
  numReports: number;
  isGallery: boolean;
  isMeta: boolean;
  createdAt: number;
  isApproved: boolean;
  isArchived: boolean;
  distinguished: number;
  ignoreReports: boolean;
  isSelf: boolean;
  isVideo: boolean;
  isLocked: boolean;
  isSpoiler: boolean;
  subredditId: `t5_${string}`;
  upvotes: number;
  downvotes: number;
  url: string;
  isSticky: boolean;
  linkFlair: {
    text: string;
    cssClass: string;
    backgroundColor: string;
    templateId: string;
    textColor: string;
  };
  authorFlair: {
    userId: `t2_${string}`;
    subredditId: `t5_${string}`;
    text: string;
    cssClass: string;
    templateId: string;
    textColor: string;
    backgroundColor: string;
    enabled: boolean;
  };
  spam: boolean;
  deleted: boolean;
  languageCode: string;
  updatedAt: number;
  gildings: number;
  score: number;
  numComments: number;
  thumbnail: string;
  media: {
    type: string;
  };
  crosspostParentId: string;
  permalink: string;
  isPoll: boolean;
  isPromoted: boolean;
  isMultiMedia: boolean;
  type: string;
  unlisted: boolean;
  galleryImages: any[];
  isImage: boolean;
  mediaUrls: string[];
  isClubContent: boolean;
}

export interface PostData {
  id: string;
  authorId: string;
  authorName: string;
  snoovatarImage: string;
  userProfileLink: string;
  title: string;
  body: string;
  thumbnail: string;
  score: string;
  permalink: string;
  timestamp: string;
  image: string;
  galleryImages: string;
  postLink: string;
  userFlairText?: string;
  flairBgColor?: string;
  flairTextColor?: string;
}

export type PostDatRecord = Record<string, string>;
