import { context, navigateTo } from "@devvit/web/client";
import { trackAnalytics } from "../lib/trackAnalytics";
import { useInit } from "../hooks/useInit";

interface FooterProps {
  subtitle?: string;
}

interface LogEntry {
  timestamp: string;
  message: string;
}

export default function Footer({ subtitle = 'Recent Announcements' }: FooterProps) {
  const {username} = useInit()

  const handleAddToSubreddit = () => {
    trackAnalytics(); // Track user interaction
    navigateTo('https://developers.reddit.com/apps/dev-insights');
  };

  const handleReportIssue = () => {
    trackAnalytics(); // Track user interaction
    navigateTo(`https://www.reddit.com/message/compose/?to=PlexversalHD&subject=${encodeURIComponent('Report issue with Dev-Insights app')}`);
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
        <p className="max-[600px]:hidden">
          <strong>{subtitle}</strong>
        </p>
        <div className="flex gap-3 items-center transition-colors">
          <p className="min-[601px]:hidden">
            <strong>{subtitle}</strong>
          </p>
          <span className="min-[601px]:hidden text-gray-300">|</span>
          {username && username == 'PlexversalHD' && <>
          <button
            className="cursor-pointer hover:underline hover:text-gray-700"
            onClick={handleDebugLogs}
          >
            Debug logs
          </button>
          <span className="text-gray-300">|</span>
          </>
          }
          
          <button
            className="cursor-pointer hover:underline hover:text-gray-700"
            onClick={handleAddToSubreddit}
          >
            Add to subreddit
          </button>
          <span className="text-gray-300">|</span>
          <button
            className="cursor-pointer hover:underline hover:text-gray-700"
            onClick={handleReportIssue}
          >
            Report issue
          </button>
        </div>

      </header>
  )

}
