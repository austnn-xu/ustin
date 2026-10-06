import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addDays, dayKey } from '@/lib/dates';

export const MAX_HEARTS = 5;
/** One heart comes back every half hour. */
export const HEART_REFILL_MS = 30 * 60 * 1000;

export const XP = {
  lesson: 10,
  review: 15,
  perfectBonus: 5,
  /** Looking up a real item for the first time. */
  newItem: 5,
  /** Looking up an item you have looked up before, once a day. */
  repeatItem: 1,
} as const;

export type LessonRecord = {
  completions: number;
  bestAccuracy: number;
  /** 1–3, from the best accuracy. */
  stars: number;
  lastAt: number;
};

type Streak = { count: number; best: number; lastDay: string | null };

export type ProgressState = {
  xp: number;
  xpByDay: Record<string, number>;
  streak: Streak;
  lessons: Record<string, LessonRecord>;
  perfectLessons: number;
  hearts: number;
  /** When `hearts` was last written; refills are computed from it. */
  heartsAt: number;
  /** Real items looked up in What bin?, by object id → most recent lookup time. */
  sorted: Record<string, number>;
  /** Objects answered wrong in lessons → how many times. Feeds practice. */
  mistakes: Record<string, number>;
  /** Achievements already celebrated, so each is announced once. */
  celebrated: Record<string, number>;

  completeLesson: (input: { lessonId: string; review: boolean; correct: number; total: number }) => LessonResult;
  loseHeart: () => void;
  gainHeart: () => void;
  syncHearts: () => void;
  recordSort: (objectId: string) => SortResult;
  recordMistakes: (objectIds: string[]) => void;
  markCelebrated: (ids: string[]) => void;
  reset: () => void;
};

export type LessonResult = {
  xpEarned: number;
  accuracy: number;
  stars: number;
  perfect: boolean;
  /** True the first time today that a lesson or lookup kept the streak going. */
  streakExtended: boolean;
  streak: number;
  goalJustReached: boolean;
};

export type SortResult = { isNew: boolean; xpEarned: number; streakExtended: boolean; heartEarned: boolean };

const initial = {
  xp: 0,
  xpByDay: {} as Record<string, number>,
  streak: { count: 0, best: 0, lastDay: null } as Streak,
  lessons: {} as Record<string, LessonRecord>,
  perfectLessons: 0,
  hearts: MAX_HEARTS,
  heartsAt: 0,
  sorted: {} as Record<string, number>,
  mistakes: {} as Record<string, number>,
  celebrated: {} as Record<string, number>,
};

/** The streak after doing something today. */
function bump(streak: Streak, today: string): { streak: Streak; extended: boolean } {
  if (streak.lastDay === today) return { streak, extended: false };
  const count = streak.lastDay === addDays(today, -1) ? streak.count + 1 : 1;
  return { streak: { count, best: Math.max(streak.best, count), lastDay: today }, extended: true };
}

/** Hearts right now, including the ones that refilled while the app was closed. */
export function heartsNow(hearts: number, heartsAt: number, now = Date.now()) {
  if (hearts >= MAX_HEARTS) return { hearts: MAX_HEARTS, nextAt: null as number | null };
  const refilled = Math.floor((now - heartsAt) / HEART_REFILL_MS);
  const total = Math.min(MAX_HEARTS, hearts + Math.max(0, refilled));
  if (total >= MAX_HEARTS) return { hearts: MAX_HEARTS, nextAt: null };
  return { hearts: total, nextAt: heartsAt + (Math.max(0, refilled) + 1) * HEART_REFILL_MS };
}

/**
 * Write the refilled hearts back into state without losing progress towards the next one: a heart that is 20 minutes
 * into its 30-minute refill stays 20 minutes in.
 */
function materialize(hearts: number, heartsAt: number, now = Date.now()) {
  if (hearts >= MAX_HEARTS) return { hearts: MAX_HEARTS, heartsAt: now };
  const refilled = Math.max(0, Math.floor((now - heartsAt) / HEART_REFILL_MS));
  const total = Math.min(MAX_HEARTS, hearts + refilled);
  return { hearts: total, heartsAt: total >= MAX_HEARTS ? now : heartsAt + refilled * HEART_REFILL_MS };
}

/** The streak as it stands today: a streak whose last day is before yesterday is already broken. */
export function currentStreak(streak: Streak, today = dayKey()) {
  if (!streak.lastDay) return { count: 0, doneToday: false };
  if (streak.lastDay === today) return { count: streak.count, doneToday: true };
  if (streak.lastDay === addDays(today, -1)) return { count: streak.count, doneToday: false };
  return { count: 0, doneToday: false };
}

export const starsFor = (accuracy: number) => (accuracy >= 0.95 ? 3 : accuracy >= 0.75 ? 2 : 1);

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initial,

      completeLesson: ({ lessonId, review, correct, total }) => {
        const state = get();
        const today = dayKey();
        const accuracy = total ? correct / total : 0;
        const perfect = correct === total;
        const xpEarned = (review ? XP.review : XP.lesson) + (perfect ? XP.perfectBonus : 0);
        const before = state.xpByDay[today] ?? 0;
        const { streak, extended } = bump(state.streak, today);
        const prev = state.lessons[lessonId];
        const best = Math.max(prev?.bestAccuracy ?? 0, accuracy);

        set({
          xp: state.xp + xpEarned,
          xpByDay: { ...state.xpByDay, [today]: before + xpEarned },
          streak,
          perfectLessons: state.perfectLessons + (perfect ? 1 : 0),
          lessons: {
            ...state.lessons,
            [lessonId]: { completions: (prev?.completions ?? 0) + 1, bestAccuracy: best, stars: starsFor(best), lastAt: Date.now() },
          },
        });

        // The daily goal lives in settings; the screen compares before/after against it.
        return {
          xpEarned,
          accuracy,
          stars: starsFor(accuracy),
          perfect,
          streakExtended: extended,
          streak: streak.count,
          goalJustReached: false,
        };
      },

      loseHeart: () => {
        const now = materialize(get().hearts, get().heartsAt);
        // Losing the first heart from full starts the refill clock.
        set({ hearts: Math.max(0, now.hearts - 1), heartsAt: now.heartsAt });
      },

      gainHeart: () => {
        const now = materialize(get().hearts, get().heartsAt);
        set({ hearts: Math.min(MAX_HEARTS, now.hearts + 1), heartsAt: now.heartsAt });
      },

      syncHearts: () => {
        const now = materialize(get().hearts, get().heartsAt);
        if (now.hearts !== get().hearts) set(now);
      },

      recordSort: (objectId) => {
        const state = get();
        const today = dayKey();
        const last = state.sorted[objectId];
        const isNew = !last;
        // A repeat lookup earns its XP once a day, so reopening an item is not a way to farm points.
        const xpEarned = isNew ? XP.newItem : dayKey(new Date(last)) === today ? 0 : XP.repeatItem;
        const { streak, extended } = bump(state.streak, today);
        const now = materialize(state.hearts, state.heartsAt);
        // Sorting a real item for the first time earns a heart back — learning in the real world counts.
        const heartEarned = isNew && now.hearts < MAX_HEARTS;
        set({
          xp: state.xp + xpEarned,
          xpByDay: { ...state.xpByDay, [today]: (state.xpByDay[today] ?? 0) + xpEarned },
          streak,
          sorted: { ...state.sorted, [objectId]: Date.now() },
          ...(heartEarned ? { hearts: now.hearts + 1, heartsAt: now.heartsAt } : null),
        });
        return { isNew, xpEarned, streakExtended: extended, heartEarned };
      },

      recordMistakes: (objectIds) => {
        if (!objectIds.length) return;
        const mistakes = { ...get().mistakes };
        for (const id of objectIds) mistakes[id] = (mistakes[id] ?? 0) + 1;
        set({ mistakes });
      },

      markCelebrated: (ids) => {
        if (!ids.length) return;
        const celebrated = { ...get().celebrated };
        for (const id of ids) celebrated[id] = Date.now();
        set({ celebrated });
      },

      reset: () => set({ ...initial }),
    }),
    {
      name: 'ustin-progress',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        xp: s.xp,
        xpByDay: s.xpByDay,
        streak: s.streak,
        lessons: s.lessons,
        perfectLessons: s.perfectLessons,
        hearts: s.hearts,
        heartsAt: s.heartsAt,
        sorted: s.sorted,
        mistakes: s.mistakes,
        celebrated: s.celebrated,
      }),
    },
  ),
);
