import { reddit } from "@devvit/web/server"
import { CommandResult } from "./pinCommand"

export default async function removePostCommand(postId: `t3_${string}`): Promise<CommandResult> {
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

    // Remove the post
    await post.remove();

    console.log(`Successfully removed post: ${postId}`);

    return {
      success: true,
      message: `Successfully removed post ${postId}`,
      data: { postId }
    };

  } catch (error) {
    console.error(`Error removing post ${postId}:`, error);
    return {
      success: false,
      message: `Failed to remove post: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
