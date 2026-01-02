import { reddit } from "@devvit/web/server"
import { CommandResult } from "./pinCommand"

export default async function removeCommentCommand(commentId: `t1_${string}`): Promise<CommandResult> {
  try {
    // Validate comment ID format
    if (!commentId || !commentId.startsWith('t1_')) {
      return {
        success: false,
        message: `Invalid comment ID format: ${commentId}. Expected format: t1_xxxxx`
      };
    }

    // Get comment by ID
    const comment = await reddit.getCommentById(commentId);

    if (!comment) {
      return {
        success: false,
        message: `Comment not found: ${commentId}`
      };
    }

    // Remove the comment
    await comment.remove();

    console.log(`Successfully removed comment: ${commentId}`);

    return {
      success: true,
      message: `Successfully removed comment ${commentId}`,
      data: { commentId }
    };

  } catch (error) {
    console.error(`Error removing comment ${commentId}:`, error);
    return {
      success: false,
      message: `Failed to remove comment: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
