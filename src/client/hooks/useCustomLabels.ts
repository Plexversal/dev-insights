import { useEffect, useState } from 'react';

interface CustomLabels {
  postsButtonName: string;
  commentsButtonName: string;
  bottomSubtitle: string;
}

const DEFAULT_LABELS: CustomLabels = {
  postsButtonName: 'Announcements',
  commentsButtonName: 'Official Replies',
  bottomSubtitle: 'Recent Announcements',
};

export const useCustomLabels = () => {
  const [labels, setLabels] = useState<CustomLabels>(DEFAULT_LABELS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const res = await fetch('/api/custom-labels');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: CustomLabels = await res.json();
        // console.log(data)
        setLabels(data);
      } catch (err) {
        console.error('Failed to fetch custom labels, using defaults', err);
        // Keep default values on error
        setLabels(DEFAULT_LABELS);
      } finally {
        setLoading(false);
      }
    };
    void fetchLabels();
  }, []);

  return { ...labels, loading };
};
