import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { safeLocalGet, safeLocalSet } from './storage';

export type ViewMode = 'patient' | 'clinician';

type ViewModeContextValue = {
  viewMode: ViewMode;
  toggleViewMode: () => void;
};

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('patient');

  useEffect(() => {
    const stored = safeLocalGet('gedi_view_mode');
    if (stored === 'clinician' || stored === 'patient') {
      setViewMode(stored);
    }
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next: ViewMode = prev === 'patient' ? 'clinician' : 'patient';
      safeLocalSet('gedi_view_mode', next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ viewMode, toggleViewMode }), [viewMode, toggleViewMode]);

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used within ViewModeProvider');
  return ctx;
}
