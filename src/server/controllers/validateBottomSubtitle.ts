import { Request, Response } from 'express';

export const validateBottomSubtitle = async (req: Request, res: Response): Promise<Response> => {
  const { value } = req.body;

  if (!value || value.trim() === '') {
    return res.json({
      success: false,
      error: 'You need at least 1 valid character.',
    });
  }

  // Check if value contains markdown link pattern but also has extra text
  const hasMarkdownLink = /\[([^\]]+)\]\(([^)]+)\)/.test(value);
  const isExactMarkdownLink = /^\[([^\]]+)\]\(([^)]+)\)$/.test(value);

  if (hasMarkdownLink && !isExactMarkdownLink) {
    return res.json({
      success: false,
      error: 'Please use either a markdown link [text](url) OR plain text, not both',
    });
  }

  // Check if it's a markdown link format [text](link)
  const markdownLinkRegex = /^\[([^\]]+)\]\(([^)]+)\)$/;
  const match = value.match(markdownLinkRegex);

  if (match) {
    // It's a markdown link
    const text = match[1];
    const link = match[2];

    // Validate text length
    if (text.length > 30) {
      return res.json({
        success: false,
        error: 'Link text too long, max 30 characters',
      });
    }

    if (text.trim() === '') {
      return res.json({
        success: false,
        error: 'Link text cannot be empty',
      });
    }

    // Validate link length
    if (link.length > 1000) {
      return res.json({
        success: false,
        error: 'Link URL too long, max 1000 characters',
      });
    }

    // Validate link domain
    try {
      const url = new URL(link);
      const hostname = url.hostname.toLowerCase();

      // Check if it's a reddit domain (*.reddit.com) or x.com/twitter.com
      const isRedditDomain = hostname === 'reddit.com' || hostname.endsWith('.reddit.com');
      const isTwitterDomain = hostname === 'x.com' || hostname === 'twitter.com';

      if (!isRedditDomain && !isTwitterDomain) {
        return res.json({
          success: false,
          error: 'Only *.reddit.com, x.com, or twitter.com domains are allowed',
        });
      }
    } catch (error) {
      return res.json({
        success: false,
        error: 'Invalid URL format in markdown link',
      });
    }

    return res.json({ success: true });
  } else {
    // It's plain text, validate length
    if (value.length > 30) {
      return res.json({
        success: false,
        error: 'Text too long, max 30 characters',
      });
    }

    return res.json({ success: true });
  }
};
