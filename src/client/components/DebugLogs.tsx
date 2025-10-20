import { useEffect, useState } from 'react';

interface LogEntry {
  timestamp: string;
  message: string;
}

export const DebugLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/debug/critical-logs');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setLogs(data.logs || []);

        // Log to console for easy viewing
        console.log('=== BACKEND CRITICAL LOGS ===');
        console.log(`Total logs: ${data.count}`);
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
        console.log('=== END BACKEND LOGS ===');

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch logs';
        setError(errorMsg);
        console.error('Failed to fetch critical logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
          <p className="text-gray-900 dark:text-gray-200">Loading logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
            Logs have been printed to the console if available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden">
      {/* Component exists only to trigger log fetching and console output */}
      {/* User should check browser console for formatted logs */}
    </div>
  );
};
