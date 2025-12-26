import { context, navigateTo } from "@devvit/web/client";
import { trackAnalytics } from "../lib/trackAnalytics";
import { useInit } from "../hooks/useInit";

interface FooterProps {
  subtitle?: string;
  loading?: boolean;
}

interface LogEntry {
  timestamp: string;
  message: string;
}

interface ParsedSubtitle {
  isLink: boolean;
  text: string;
  url?: string;
}

function parseSubtitle(subtitle: string): ParsedSubtitle {
  // Check if it's a markdown link format [text](link)
  const markdownLinkRegex = /^\[([^\]]+)\]\(([^)]+)\)$/;
  const match = subtitle.match(markdownLinkRegex);

  if (match && match[1] && match[2]) {
    return {
      isLink: true,
      text: match[1],
      url: match[2]
    };
  }

  return {
    isLink: false,
    text: subtitle
  };
}

export default function Footer({ subtitle = 'Recent Announcements', loading = false }: FooterProps) {
  const {username} = useInit();

  // Use default if subtitle is empty or undefined after loading
  const displaySubtitle = (!loading && (!subtitle || subtitle.trim() === ''))
    ? 'Recent Announcements'
    : subtitle;

  const parsedSubtitle = parseSubtitle(displaySubtitle || 'Recent Announcements');

  const handleAddToSubreddit = () => {
    trackAnalytics(); // Track user interaction
    navigateTo('https://developers.reddit.com/apps/dev-insights');
  };

  const handleReportIssue = () => {
    trackAnalytics(); // Track user interaction
    navigateTo(`https://www.reddit.com/message/compose/?to=PlexversalHD&subject=${encodeURIComponent('Report issue with Dev-Insights app')}`);
  };

  const handleSubtitleClick = () => {
    if (parsedSubtitle.isLink && parsedSubtitle.url) {
      trackAnalytics(); // Track user interaction
      navigateTo(parsedSubtitle.url);
    }
  };

  const handleDebugLogs = async () => {
    trackAnalytics(); // Track user interaction

    try {
      const res = await fetch('/api/debug/critical-logs');
      if (!res.ok) {
        console.error(`Failed to fetch logs: HTTP ${res.status}`);
        return;
      }

      const data = await res.json();

      // Log to console for easy viewing
      console.log('=== BACKEND CRITICAL LOGS ===');
      console.log(`Total logs: ${data.count}`);

      if (data.logs && data.logs.length > 0) {
        data.logs.forEach((log: LogEntry, index: number) => {
          console.log(`[${index}] ${log.timestamp}`);

          // Try to parse JSON if it looks like an object
          try {
            const parsed = JSON.parse(log.message);
            console.log(parsed);
          } catch {
            // Not JSON, just log as-is
            console.log(log.message);
          }
        });
      } else {
        console.log('No logs found');
      }

      console.log('=== END BACKEND LOGS ===');
    } catch (error) {
      console.error('Failed to fetch critical logs:', error);
    }
  };

  return (
      <header className="w-full max-w-2xl flex max-[600px]:flex-col max-[600px]:justify-center justify-between items-center text-[0.75em] text-gray-600 max-[600px]:gap-2">
        {!loading && (
          <p className="max-[600px]:hidden">
            {parsedSubtitle.isLink ? (
              <button
                onClick={handleSubtitleClick}
                className="cursor-pointer underline dark:hover:text-gray-100 transition-colors font-bold"
                style={{ ['--hover-color' as any]: '#5695cc' }}
                onMouseEnter={(e) => !document.documentElement.classList.contains('dark') && (e.currentTarget.style.color = '#5695cc')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '')}
              >
                {parsedSubtitle.text}
              </button>
            ) : (
              <strong>{parsedSubtitle.text}</strong>
            )}
          </p>
        )}
        <div className="flex gap-3 items-center transition-colors">
          {!loading && (
            <p className="min-[601px]:hidden">
              {parsedSubtitle.isLink ? (
                <button
                  onClick={handleSubtitleClick}
                  className="cursor-pointer underline dark:hover:text-gray-100 transition-colors font-bold"
                  onMouseEnter={(e) => !document.documentElement.classList.contains('dark') && (e.currentTarget.style.color = '#5695cc')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                >
                  {parsedSubtitle.text}
                </button>
              ) : (
                <strong>{parsedSubtitle.text}</strong>
              )}
            </p>
          )}
          {!loading && <span className="min-[601px]:hidden text-gray-300">|</span>}
          {username && username == 'PlexversalHD' && <>
          <button
            className="cursor-pointer underline dark:hover:text-gray-100 transition-colors"
            onClick={handleDebugLogs}
            onMouseEnter={(e) => !document.documentElement.classList.contains('dark') && (e.currentTarget.style.color = '#5695cc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            Debug logs
          </button>
          <span className="text-gray-300">|</span>
          </>
          }

          <button
            className="cursor-pointer underline dark:hover:text-gray-100 transition-colors"
            onClick={handleAddToSubreddit}
            onMouseEnter={(e) => !document.documentElement.classList.contains('dark') && (e.currentTarget.style.color = '#5695cc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            Add to subreddit
          </button>
          <span className="text-gray-300">|</span>
          <button
            className="cursor-pointer underline dark:hover:text-gray-100 transition-colors"
            onClick={handleReportIssue}
            onMouseEnter={(e) => !document.documentElement.classList.contains('dark') && (e.currentTarget.style.color = '#5695cc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            Report issue
          </button>
        </div>

      </header>
  )

}
