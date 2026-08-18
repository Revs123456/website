'use client';
import { createContext, useContext } from 'react';
import type { PublicSettings } from '@/lib/settings';

const SettingsContext = createContext<PublicSettings>({});

export function SettingsProvider({ children, settings }: { children: React.ReactNode; settings: PublicSettings }) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSettings(): PublicSettings {
  return useContext(SettingsContext);
}
