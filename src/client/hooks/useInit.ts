import { useEffect, useState } from 'react';
import type { InitResponse } from '../../shared/types/api';

export const useInit = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | null>(null);

  // fetch initial data
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/init');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: InitResponse = await res.json();
        if (data.type !== 'init') throw new Error('Unexpected response');
        setUsername(data.username);
        setPostId(data.postId);
      } catch (err) {
        console.error('Failed to init counter', err);
      }
    };
    void init();
  }, []);


  return {
    username,
    postId,
  } as const;
};
