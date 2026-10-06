import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ColorSchemePreference = 'system' | 'light' | 'dark';
export type DailyGoal = 10 | 20 | 30 | 50;

export type SavedPlace = {
  /** What the user sees: "Brooklyn, NY 11215" or "Current location". */
  label: string;
  lat: number;
  lon: number;
  zip?: string;
  source: 'zip' | 'gps';
};

type SettingsState = {
  colorScheme: ColorSchemePreference;
  dailyGoal: DailyGoal;
  place: SavedPlace | null;
  onboarded: boolean;
  setColorScheme: (scheme: ColorSchemePreference) => void;
  setDailyGoal: (goal: DailyGoal) => void;
  setPlace: (place: SavedPlace | null) => void;
  finishOnboarding: () => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      colorScheme: 'system',
      dailyGoal: 20,
      place: null,
      onboarded: false,
      setColorScheme: (colorScheme) => set({ colorScheme }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
      setPlace: (place) => set({ place }),
      finishOnboarding: () => set({ onboarded: true }),
    }),
    { name: 'ustin-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
