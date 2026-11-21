import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { bool, isObj, oneOf, real, text, tours } from './sanitize';

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
  /** Game PINs this device hosted or joined lately, newest first, so their podiums are one tap away. */
  recentPins: { code: string; at: number }[];
  setColorScheme: (scheme: ColorSchemePreference) => void;
  setDailyGoal: (goal: DailyGoal) => void;
  setPlace: (place: SavedPlace | null) => void;
  finishOnboarding: () => void;
  finishLessonCoaching: () => void;
  finishTour: (id: string) => void;
  /** Show every tab's tour again, each on its next visit. */
  replayTours: () => void;
  rememberPin: (code: string) => void;
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
      recentPins: [],
      setColorScheme: (colorScheme) => set({ colorScheme }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
      setPlace: (place) => set({ place }),
      finishOnboarding: () => set({ onboarded: true }),
      finishLessonCoaching: () => set({ lessonCoached: true }),
      finishTour: (id) => set((s) => ({ toursSeen: s.toursSeen.includes(id) ? s.toursSeen : [...s.toursSeen, id] })),
      replayTours: () => set({ toursSeen: [] }),
      rememberPin: (code) =>
        set((s) => ({ recentPins: [{ code, at: Date.now() }, ...s.recentPins.filter((p) => p.code !== code)].slice(0, 5) })),
    }),
    {
      name: 'ustin-settings',
      storage: createJSONStorage(() => AsyncStorage),
      // Checked field by field on the way back in (see sanitize.ts).
      merge: (persisted, current) => ({ ...current, ...cleanSettings(persisted) }),
      partialize: (s) => ({
        colorScheme: s.colorScheme,
        dailyGoal: s.dailyGoal,
        place: s.place,
        onboarded: s.onboarded,
        lessonCoached: s.lessonCoached,
        toursSeen: s.toursSeen,
        recentPins: s.recentPins,
      }),
    },
  ),
);

function cleanPlace(v: unknown): SavedPlace | null {
  if (!isObj(v)) return null;
  const lat = real(v.lat, NaN, -90, 90);
  const lon = real(v.lon, NaN, -180, 180);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  const zip = typeof v.zip === 'string' && /^\d{5}$/.test(v.zip) ? v.zip : undefined;
  return { label: text(v.label, 'Saved location', 120), lat, lon, source: oneOf(v.source, ['zip', 'gps'] as const, 'zip'), ...(zip ? { zip } : null) };
}

/** Persisted settings, checked: anything malformed falls back to its default. */
export function cleanSettings(raw: unknown): Partial<SettingsState> {
  if (!isObj(raw)) return {};
  return {
    colorScheme: oneOf(raw.colorScheme, ['system', 'light', 'dark'] as const, 'system'),
    dailyGoal: oneOf(raw.dailyGoal, [10, 20, 30, 50] as const, 20),
    place: cleanPlace(raw.place),
    onboarded: bool(raw.onboarded, false),
    lessonCoached: bool(raw.lessonCoached, false),
    toursSeen: tours(raw.toursSeen),
    recentPins: Array.isArray(raw.recentPins)
      ? raw.recentPins
          .filter((p): p is { code: string; at: number } => isObj(p) && typeof p.code === 'string' && /^\d{6}$/.test(p.code) && typeof p.at === 'number')
          .slice(0, 5)
      : [],
  };
}
