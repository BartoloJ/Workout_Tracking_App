import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserPreferences, DEFAULT_USER_PREFERENCES, PresetTheme } from '../types';

const STORAGE_KEY = 'pulse_user_preferences_v1';

interface PreferencesContextType {
  preferences: UserPreferences;
  isPreferencesModalOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  setAllPreferences: (prefs: UserPreferences) => void;
  applyPreset: (preset: PresetTheme) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_USER_PREFERENCES, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load preferences from localStorage:', e);
    }
    return DEFAULT_USER_PREFERENCES;
  });

  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

  // Persist whenever preferences update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.warn('Failed to save preferences to localStorage:', e);
    }
  }, [preferences]);

  const openPreferences = useCallback(() => {
    setIsPreferencesModalOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    setIsPreferencesModalOpen(false);
  }, []);

  const updatePreference = useCallback(<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const setAllPreferences = useCallback((newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
  }, []);

  const applyPreset = useCallback((preset: PresetTheme) => {
    switch (preset) {
      case 'ultra_minimal':
        setPreferences({
          showZone2: false,
          showStrengthVolume: false,
          showHeatmap: true,
          showStatsBar: false,
          showStreakStats: false,
          showIntensityScore: false,
          showDuration: true,
          showCardioExtraMetrics: false,
          showCardioDistance: true,
          showWorkoutNotes: true,
          showFloatingRestTimer: false,
          compactFeedView: true
        });
        break;

      case 'strength_only':
        setPreferences({
          showZone2: false,
          showStrengthVolume: false,
          showHeatmap: true,
          showStatsBar: true,
          showStreakStats: true,
          showIntensityScore: true,
          showDuration: true,
          showCardioExtraMetrics: false,
          showCardioDistance: false,
          showWorkoutNotes: true,
          showFloatingRestTimer: true,
          compactFeedView: false
        });
        break;

      case 'cardio_only':
        setPreferences({
          showZone2: false,
          showStrengthVolume: false,
          showHeatmap: true,
          showStatsBar: true,
          showStreakStats: true,
          showIntensityScore: false,
          showDuration: true,
          showCardioExtraMetrics: false,
          showCardioDistance: true,
          showWorkoutNotes: true,
          showFloatingRestTimer: false,
          compactFeedView: false
        });
        break;

      case 'full':
      default:
        setPreferences(DEFAULT_USER_PREFERENCES);
        break;
    }
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_USER_PREFERENCES);
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        isPreferencesModalOpen,
        openPreferences,
        closePreferences,
        updatePreference,
        setAllPreferences,
        applyPreset,
        resetPreferences
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
