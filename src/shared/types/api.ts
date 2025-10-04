export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
  comment: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

export type CommentCreateBody = {
  comment: {
    id: string;
    parentId: string;
    body: string;
    author: `t2_${string}`;
    numReports: number;
    collapsedBecauseCrowdControl: boolean;
    spam: boolean;
    deleted: boolean;
    createdAt: number;
    upvotes: number;
    downvotes: number;
    languageCode: string;
    lastModifiedAt: number;
    gilded: boolean;
    score: number;
    permalink: string;
    hasMedia: boolean;
    postId: string;
    subredditId: string;
    elementTypes: string[];
    mediaUrls: string[];
  };
  author: {
    id: string;
    name: string;
    isGold: boolean;
    snoovatarImage: string;
    url: string;
    spam: boolean;
    banned: boolean;
    karma: number;
    iconImage: string;
    description: string;
    suspended: boolean;
  };
  post: {
    id: string;
    title: string;
    selftext: string;
    nsfw: boolean;
    authorId: string;
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
    subredditId: string;
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
      userId: string;
      subredditId: string;
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
  };
  subreddit: {
    id: string;
    name: string;
    nsfw: boolean;
    type: number;
    spam: boolean;
    quarantined: boolean;
    topics: string[];
    rating: number;
    subscribersCount: number;
    permalink: string;
  };
  type: 'CommentCreate';
};
