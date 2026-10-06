import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_OWNED, findCosmetic, type Outfit, type Slot } from '@/lib/cosmetics';
import { addDays, dayKey } from '@/lib/dates';

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
  /** Real items looked up in What bin?, by object id → most recent lookup time. */
  sorted: Record<string, number>;
  /** Objects answered wrong in lessons → how many times. Feeds practice. */
  mistakes: Record<string, number>;
  /** Achievements already celebrated, so each is announced once. */
  celebrated: Record<string, number>;
  /** Coins earned in lessons, spent in the shop. */
  coins: number;
  /** Cosmetics owned, by id → when bought. */
  owned: Record<string, number>;
  /** What Tin is wearing. */
  equipped: Outfit;

  completeLesson: (input: { lessonId: string; review: boolean; correct: number; total: number }) => LessonResult;
  recordSort: (objectId: string) => SortResult;
  recordMistakes: (objectIds: string[]) => void;
  markCelebrated: (ids: string[]) => void;
  earnCoins: (amount: number) => void;
  /** Buy and put on a cosmetic. */
  buy: (id: string) => 'bought' | 'owned' | 'short' | 'unknown';
  /** Put on an owned cosmetic, or take a slot off with null (paint can only be swapped). */
  equip: (slot: Slot, id: string | null) => void;
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

export type SortResult = { isNew: boolean; xpEarned: number; streakExtended: boolean };

const initial = {
  xp: 0,
  xpByDay: {} as Record<string, number>,
  streak: { count: 0, best: 0, lastDay: null } as Streak,
  lessons: {} as Record<string, LessonRecord>,
  perfectLessons: 0,
  sorted: {} as Record<string, number>,
  mistakes: {} as Record<string, number>,
  celebrated: {} as Record<string, number>,
  coins: 0,
  owned: Object.fromEntries(DEFAULT_OWNED.map((id) => [id, 0])) as Record<string, number>,
  equipped: { paint: 'paint-green' } as Outfit,
};

/** The streak after doing something today. */
function bump(streak: Streak, today: string): { streak: Streak; extended: boolean } {
  if (streak.lastDay === today) return { streak, extended: false };
  const count = streak.lastDay === addDays(today, -1) ? streak.count + 1 : 1;
  return { streak: { count, best: Math.max(streak.best, count), lastDay: today }, extended: true };
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

      recordSort: (objectId) => {
        const state = get();
        const today = dayKey();
        const last = state.sorted[objectId];
        const isNew = !last;
        // A repeat lookup earns its XP once a day, so reopening an item is not a way to farm points.
        const xpEarned = isNew ? XP.newItem : dayKey(new Date(last)) === today ? 0 : XP.repeatItem;
        const { streak, extended } = bump(state.streak, today);
        set({
          xp: state.xp + xpEarned,
          xpByDay: { ...state.xpByDay, [today]: (state.xpByDay[today] ?? 0) + xpEarned },
          streak,
          sorted: { ...state.sorted, [objectId]: Date.now() },
        });
        return { isNew, xpEarned, streakExtended: extended };
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

      earnCoins: (amount) => {
        if (amount > 0) set({ coins: get().coins + amount });
      },

      buy: (id) => {
        const item = findCosmetic(id);
        const state = get();
        if (!item) return 'unknown';
        if (state.owned[id] !== undefined) return 'owned';
        if (state.coins < item.price) return 'short';
        set({
          coins: state.coins - item.price,
          owned: { ...state.owned, [id]: Date.now() },
          equipped: { ...state.equipped, [item.slot]: id },
        });
        return 'bought';
      },

      equip: (slot, id) => {
        const state = get();
        if (id && state.owned[id] === undefined) return;
        if (!id && slot === 'paint') return;
        const equipped = { ...state.equipped };
        if (id) equipped[slot] = id;
        else delete equipped[slot];
        set({ equipped });
      },

      reset: () => set({ ...initial }),
    }),
    {
      name: 'ustin-progress',
      storage: createJSONStorage(() => AsyncStorage),
      // v1 dropped hearts: mistakes no longer cost anything, they just come back at the end of the lesson.
      version: 1,
      migrate: (persisted) => {
        const { hearts: _h, heartsAt: _a, ...rest } = (persisted ?? {}) as Record<string, unknown>;
        return rest as Partial<ProgressState>;
      },
      partialize: (s) => ({
        xp: s.xp,
        xpByDay: s.xpByDay,
        streak: s.streak,
        lessons: s.lessons,
        perfectLessons: s.perfectLessons,
        sorted: s.sorted,
        mistakes: s.mistakes,
        celebrated: s.celebrated,
        coins: s.coins,
        owned: s.owned,
        equipped: s.equipped,
      }),
    },
  ),
);
