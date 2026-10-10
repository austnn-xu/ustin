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
  /** The first lesson walks you through answering (pick, Check, read why, Continue) until this is set. */
  lessonCoached: boolean;
  /** Tabs whose tour has been seen (see src/lib/tour.ts). */
  toursSeen: string[];
  setColorScheme: (scheme: ColorSchemePreference) => void;
  setDailyGoal: (goal: DailyGoal) => void;
  setPlace: (place: SavedPlace | null) => void;
  finishOnboarding: () => void;
  finishLessonCoaching: () => void;
  finishTour: (id: string) => void;
  /** Show every tab's tour again, each on its next visit. */
  replayTours: () => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      colorScheme: 'system',
      dailyGoal: 20,
      place: null,
      onboarded: false,
      lessonCoached: false,
      toursSeen: [],
      setColorScheme: (colorScheme) => set({ colorScheme }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
      setPlace: (place) => set({ place }),
      finishOnboarding: () => set({ onboarded: true }),
      finishLessonCoaching: () => set({ lessonCoached: true }),
      finishTour: (id) => set((s) => ({ toursSeen: s.toursSeen.includes(id) ? s.toursSeen : [...s.toursSeen, id] })),
      replayTours: () => set({ toursSeen: [] }),
    }),
    { name: 'ustin-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
