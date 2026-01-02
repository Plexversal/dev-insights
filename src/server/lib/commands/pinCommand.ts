import { reddit } from "@devvit/web/server"

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export default async function pinCommand(postId: `t3_${string}`): Promise<CommandResult> {
  try {
    // Validate post ID format
    if (!postId || !postId.startsWith('t3_')) {
      return {
        success: false,
        message: `Invalid post ID format: ${postId}. Expected format: t3_xxxxx`
      };
    }

    // Get post by ID
    const post = await reddit.getPostById(postId);

    if (!post) {
      return {
        success: false,
        message: `Post not found: ${postId}`
      };
    }

    // Check if post is removed and approve it first if needed
    if (post.removed) {
      console.log(`Post ${postId} is removed, approving before pinning...`);
      await post.approve();
    }

    // Sticky the post (position 2)
    await post.sticky(2);

    console.log(`Successfully pinned post: ${postId}`);

    return {
      success: true,
      message: `Successfully pinned post ${postId}`,
      data: { postId }
    };

  } catch (error) {
    console.error(`Error pinning post ${postId}:`, error);
    return {
      success: false,
      message: `Failed to pin post: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
