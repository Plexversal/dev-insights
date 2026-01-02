import { Request, Response } from 'express';
import { context, reddit, settings } from '@devvit/web/server';
import pinCommand, { CommandResult } from '../lib/commands/pinCommand';
import unpinCommand from '../lib/commands/unpinCommand';
import removeCommentCommand from '../lib/commands/removeCommentCommand';
import removePostCommand from '../lib/commands/removePostCommand';

// Extract commands from wiki content
function extractCommands(content: string) {
  const lines = content.split('\n');
  const commands = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and comment lines (starting with ~)
    if (!trimmedLine || trimmedLine.startsWith('~') || trimmedLine.startsWith('#')) {
      continue;
    }

    // Check if line starts with /
    if (trimmedLine.startsWith('/')) {
      // Parse command name and argument
      const fullCommand = trimmedLine.substring(1).trim();
      const parts = fullCommand.split(/\s+/);
      const commandName = parts[0]?.toLowerCase();
      const arg = parts[1]; // First argument (ID)

      if (!commandName) {
        continue;
      }

      commands.push({
        raw: trimmedLine,
        command: commandName,
        ...(arg && { arg })
      });
    }
  }

  return commands;
}

// Execute a single command
async function executeCommand(command: { raw: string; command: string; arg?: string }): Promise<CommandResult> {
  console.log(`Executing command: ${command.raw}`);

  if (!command.arg) {
    return {
      success: false,
      message: `Command ${command.command} requires an ID argument`
    };
  }

  switch (command.command) {
    case 'pin':
      return await pinCommand(`t3_${command.arg}` as `t3_${string}`);

    case 'unpin':
      return await unpinCommand(`t3_${command.arg}`);

    case 'removecomment':
      return await removeCommentCommand(`t1_${command.arg}` as `t1_${string}`);

    case 'removepost':
      return await removePostCommand(`t3_${command.arg}` as `t3_${string}`);

    default:
      return {
        success: false,
        message: `Unknown command: ${command.command}`
      };
  }
}

export const getWikiCommands = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {

    let wikiPage = await reddit.getWikiPage(`dev_insights_dev`, `commands`)

    // Access all getters to make them visible in console
    const wikiData = {
      name: wikiPage.name,
      subredditName: wikiPage.subredditName,
      content: wikiPage.content,
      contentHtml: wikiPage.contentHtml,
      revisionId: wikiPage.revisionId,
      revisionDate: wikiPage.revisionDate,
      revisionReason: wikiPage.revisionReason,
      revisionAuthor: wikiPage.revisionAuthor
    };


    // Extract commands from wiki content
    const commands = extractCommands(wikiData.content);
    commands.length > 0 && console.log('Extracted commands:', commands);

    // Execute commands in order
    const executedCommands = [];
    const executedCommandLines = new Set<string>();

    for (const command of commands) {
      const result = await executeCommand(command);

      if (result.success) {
        console.log(`✓ ${result.message}`);
        executedCommands.push({
          command: command.raw,
          status: 'success',
          message: result.message,
          data: result.data
        });
      } else {
        console.error(`✗ ${result.message}`);
        executedCommands.push({
          command: command.raw,
          status: 'failed',
          message: result.message
        });
      }

      // Always add to executed lines (even on failure) to remove from wiki
      executedCommandLines.add(command.raw);
    }

    // Remove executed commands from wiki content
    const updatedContent = wikiData.content
      .split('\n')
      .filter(line => !executedCommandLines.has(line.trim()))
      .join('\n');

    // Update wiki page with commands removed
    await reddit.updateWikiPage({
      subredditName: wikiData.subredditName,
      page: wikiData.name,
      content: updatedContent
    });
    res.json({
      success: true,
      commandsExecuted: executedCommands
    });
  } catch (error) {
    console.error(`Error fetching commands: ${error}`);
    // Return default values in case of error
    res.json({
      success: false,
      commandsExecuted: null
    });
  }
};
