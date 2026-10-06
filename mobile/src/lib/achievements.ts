import type { LucideIcon } from 'lucide-react-native';
import { Award, Crown, Flame, Footprints, Gem, ScanLine, ShieldCheck, Sparkles, Star, Trophy } from 'lucide-react-native';
import type { HueName } from '@/theme';
import type { ProgressState } from '@/stores/progress';
import { unitsCompleted } from './course';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  hue: HueName;
  goal: number;
  value: (s: ProgressState) => number;
};

const lessonsDone = (s: ProgressState) => Object.keys(s.lessons).length;
const itemsSorted = (s: ProgressState) => Object.keys(s.sorted).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-lesson', title: 'First steps', description: 'Finish your first lesson', icon: Footprints, hue: 'green', goal: 1, value: lessonsDone },
  { id: 'first-real', title: 'Out in the wild', description: 'Look up a real item in What bin?', icon: ScanLine, hue: 'blue', goal: 1, value: itemsSorted },
  { id: 'streak-3', title: 'On a roll', description: 'Reach a 3-day streak', icon: Flame, hue: 'orange', goal: 3, value: (s) => s.streak.best },
  { id: 'perfect', title: 'Flawless', description: 'Finish a lesson without a mistake', icon: Sparkles, hue: 'yellow', goal: 1, value: (s) => s.perfectLessons },
  { id: 'xp-100', title: 'Century', description: 'Earn 100 XP', icon: Star, hue: 'yellow', goal: 100, value: (s) => s.xp },
  { id: 'unit', title: 'Shelf cleared', description: 'Finish every lesson in a unit', icon: Trophy, hue: 'purple', goal: 1, value: (s) => unitsCompleted(s.lessons).length },
  { id: 'streak-7', title: 'Week of wins', description: 'Reach a 7-day streak', icon: Crown, hue: 'orange', goal: 7, value: (s) => s.streak.best },
  { id: 'sorter-10', title: 'Sorting pro', description: 'Look up 10 different real items', icon: Award, hue: 'blue', goal: 10, value: itemsSorted },
  {
    id: 'hazard',
    title: 'Hazard hero',
    description: 'Finish the Under the sink unit',
    icon: ShieldCheck,
    hue: 'red',
    goal: 1,
    value: (s) => (unitsCompleted(s.lessons).includes('hazardous') ? 1 : 0),
  },
  { id: 'xp-500', title: 'Bin boss', description: 'Earn 500 XP', icon: Gem, hue: 'purple', goal: 500, value: (s) => s.xp },
];

export const isUnlocked = (a: Achievement, s: ProgressState) => a.value(s) >= a.goal;

/** Achievements unlocked but not yet announced. */
export const newlyUnlocked = (s: ProgressState) => ACHIEVEMENTS.filter((a) => isUnlocked(a, s) && !s.celebrated[a.id]);
