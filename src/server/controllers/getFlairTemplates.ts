import { Request, Response } from 'express';
import { reddit, context } from '@devvit/web/server';

export interface FlairTemplate {
  id: string;
  text: string;
  textColor: string;
  backgroundColor: string;
  allowableContent: string;
  modOnly: boolean;
  maxEmojis: number;
  allowUserEdits: boolean;
}

export const getFlairTemplatesHandler = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const allFlairs = await reddit.getUserFlairTemplates(context.subredditName);
    const detailedFlairs: FlairTemplate[] = allFlairs.map((e: any) => ({
      id: e.id,
      text: e.text,
      textColor: e.textColor,
      backgroundColor: e.backgroundColor,
      allowableContent: e.allowableContent,
      modOnly: e.modOnly,
      maxEmojis: e.maxEmojis,
      allowUserEdits: e.allowUserEdits
    }));

    res.json({
      status: 'success',
      flairTemplates: detailedFlairs
    });
  } catch (error) {
    console.error('Error fetching flair templates:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch flair templates'
    });
  }
};

// Helper function to get flair colors by matching text
export const getFlairColorsByText = async (flairText: string): Promise<{ backgroundColor?: string; textColor?: string }> => {
  try {
    const allFlairs = await reddit.getUserFlairTemplates(context.subredditName);
    const matchedFlair = allFlairs.find((flair: any) => flair.text === flairText);

    if (matchedFlair) {
      return {
        backgroundColor: matchedFlair.backgroundColor,
        textColor: matchedFlair.textColor
      };
    }

    return {};
  } catch (error) {
    console.error('Error matching flair colors:', error);
    return {};
  }
};
