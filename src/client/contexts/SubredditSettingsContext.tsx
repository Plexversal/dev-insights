import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface CustomLabels {
  postsButtonName: string;
  commentsButtonName: string;
  bottomSubtitle: string;
}

interface SubredditSettings {
  postsButtonName: string;
  commentsButtonName: string;
  bottomSubtitle: string;
  disabledComments: boolean;
  separateTabPostFlair1: string | null;
  subredditStyle: {
    primaryColor: string,
    secondaryColor: string
  } | null
  loading: boolean;
}

const DEFAULT_LABELS: CustomLabels = {
  postsButtonName: 'Announcements',
  commentsButtonName: 'Official Replies',
  bottomSubtitle: 'Recent Announcements',
};

const SubredditSettingsContext = createContext<SubredditSettings | undefined>(undefined);

export const SubredditSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [labels, setLabels] = useState<CustomLabels>(DEFAULT_LABELS);
  const [disabledComments, setDisabledComments] = useState<boolean>(false);
  const [separateTabPostFlair1, setSeparateTabPostFlair1] = useState<string | null>(null);
  const [subredditStyle, setSubredditStyle] = useState<SubredditSettings['subredditStyle'] | null>(null)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch custom labels, disabled comments, and separate tab setting in parallel
        const [labelsRes, disabledCommentsRes, separateTabRes, subStyle] = await Promise.all([
          fetch('/api/custom-labels'),
          fetch('/api/disabled-comments'),
          fetch('/api/separate-tab-setting'),
          fetch('/api/subreddit-style')
        ]);

        // Handle custom labels
        if (labelsRes.ok) {
          const labelsData: CustomLabels = await labelsRes.json();
          setLabels(labelsData);
        } else {
          console.error('Failed to fetch custom labels, using defaults');
          setLabels(DEFAULT_LABELS);
        }

        // Handle disabled comments
        if (disabledCommentsRes.ok) {
          const disabledData = await disabledCommentsRes.json();
          setDisabledComments(disabledData.disabled || false);
        } else {
          console.error('Failed to fetch disabled comments setting');
          setDisabledComments(false);
        }

        // Handle separate tab setting
        if (separateTabRes.ok) {
          const separateTabData = await separateTabRes.json();
          setSeparateTabPostFlair1(separateTabData.separateTabPostFlair1);
        } else {
          console.error('Failed to fetch separate tab setting');
          setSeparateTabPostFlair1(null);
        }

        if (subStyle.ok) {
          const subStyleData = await subStyle.json();
          setSubredditStyle(subStyleData);
        } else {
          console.error('Failed to fetch separate tab setting');
          setSubredditStyle(null);
        }
      } catch (err) {
        console.error('Failed to fetch subreddit settings', err);
        setLabels(DEFAULT_LABELS);
        setDisabledComments(false);
        setSeparateTabPostFlair1(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  const value: SubredditSettings = {
    ...labels,
    disabledComments,
    separateTabPostFlair1,
    subredditStyle,
    loading,
  };

  return (
    <SubredditSettingsContext.Provider value={value}>
      {children}
    </SubredditSettingsContext.Provider>
  );
};

export const useSubredditSettings = () => {
  const context = useContext(SubredditSettingsContext);
  if (context === undefined) {
    throw new Error('useSubredditSettings must be used within a SubredditSettingsProvider');
  }
  return context;
};
