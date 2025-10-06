import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ModContextType {
  isMod: boolean;
  loading: boolean;
}

const ModContext = createContext<ModContextType | undefined>(undefined);

interface ModProviderProps {
  children: ReactNode;
}

export const ModProvider: React.FC<ModProviderProps> = ({ children }) => {
  const [isMod, setIsMod] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkModStatus = async () => {
      try {
        const res = await fetch('/api/check-mod');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.status === 'success' && data.isMod) {
          setIsMod(true);
        } else {
          setIsMod(false);
        }
      } catch (err) {
        console.error('Failed to fetch mod permissions', err);
        setIsMod(false);
      } finally {
        setLoading(false);
      }
    };

    void checkModStatus();
  }, []);

  return (
    <ModContext.Provider value={{ isMod, loading }}>
      {children}
    </ModContext.Provider>
  );
};

export const useMod = (): ModContextType => {
  const context = useContext(ModContext);
  if (context === undefined) {
    throw new Error('useMod must be used within a ModProvider');
  }
  return context;
};
