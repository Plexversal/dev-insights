import { reddit } from "@devvit/web/server"
import { CommandResult } from "./pinCommand"

export default async function unpinCommand(postId: string): Promise<CommandResult> {
  try {
    // Validate post ID format
    if (!postId || !postId.startsWith('t3_')) {
      return {
        success: false,
        message: `Invalid post ID format: ${postId}. Expected format: t3_xxxxx`
      };
    }

    // Get post by ID
    const post = await reddit.getPostById(postId as `t3_${string}`);

    if (!post) {
      return {
        success: false,
        message: `Post not found: ${postId}`
      };
    }

    // Unsticky the post
    await post.unsticky();

    console.log(`Successfully unpinned post: ${postId}`);

    return {
      success: true,
      message: `Successfully unpinned post ${postId}`,
      data: { postId }
    };

  } catch (error) {
    console.error(`Error unpinning post ${postId}:`, error);
    return {
      success: false,
      message: `Failed to unpin post: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
