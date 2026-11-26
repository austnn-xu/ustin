import type { LucideIcon } from 'lucide-react-native';
import {
  Camera,
  CircleCheck,
  Coins,
  Flame,
  ListChecks,
  MapPin,
  Search,
  Settings2,
  Shirt,
  Split,
  Star,
  Swords,
  Trophy,
  Users,
} from 'lucide-react-native';
import type { Mood } from '@/components/art/Mascot';
import type { HueName } from '@/theme';
import { arena, rules } from './engine';
import { visionSupported } from './vision';

export type TourStep = {
  /** The real control or idea on screen, drawn with the same icon the screen uses so it is easy to spot. */
  icon: LucideIcon;
  hue: HueName;
  title: string;
  body: string;
  mood: Mood;
};

/** The tabs that have a tour, keyed by route name. */
export type TourId = 'index' | 'arena' | 'scan' | 'nearby' | 'shop' | 'profile';

/**
 * The tour of the main app: the first time you open each tab, Tin walks you through what it is for and exactly how to
 * use it, in two or three steps. Every claim here matches what the screen really does.
 */
export const TOURS: Record<TourId, { title: string; steps: TourStep[] }> = {
  index: {
    title: 'Your route',
    steps: [
      { icon: Star, hue: 'green', title: 'Each bin is a lesson', body: 'Tap the next bin to start. Five minutes each.', mood: 'happy' },
      { icon: Flame, hue: 'orange', title: 'Keep your streak', body: 'One lesson a day keeps the flame lit.', mood: 'wow' },
    ],
  },
  arena: {
    title: 'The Arena',
    steps: [
      {
        icon: Swords,
        hue: 'green',
        title: 'Quick matches',
        body: `${arena.MATCH.questions} questions, ${arena.MATCH.questionMs / 1000} seconds each. Faster means more points.`,
        mood: 'wow',
      },
      { icon: Users, hue: 'purple', title: 'Play with friends', body: 'Share a game PIN. Everyone gets the same questions.', mood: 'happy' },
      { icon: Trophy, hue: 'yellow', title: 'Climb the leagues', body: 'Top of your group moves up each week.', mood: 'cheer' },
    ],
  },
  scan: {
    title: 'What bin?',
    steps: [
      { icon: Search, hue: 'blue', title: 'Look it up', body: `Type anything. I know ${rules.OBJECTS.length} things.`, mood: 'happy' },
      visionSupported
        ? { icon: Camera, hue: 'blue', title: 'Or snap it', body: 'Your photo never leaves your phone.', mood: 'thinking' }
        : { icon: ListChecks, hue: 'blue', title: 'One quick question', body: "If it changes the answer, I'll ask.", mood: 'thinking' },
      { icon: Split, hue: 'green', title: 'Every part, and why', body: 'Where each bit goes, and the reason.', mood: 'cheer' },
    ],
  },
  nearby: {
    title: 'Near me',
    steps: [
      { icon: MapPin, hue: 'orange', title: 'For things no bin takes', body: 'Batteries, paint, old phones. Pick one below.', mood: 'thinking' },
      { icon: CircleCheck, hue: 'green', title: 'Real places', body: 'From OpenStreetMap. Orange means call ahead.', mood: 'happy' },
    ],
  },
  shop: {
    title: 'The shop',
    steps: [
      { icon: Coins, hue: 'yellow', title: 'Earn coins', body: 'Right answers pay. Winning pays more.', mood: 'wow' },
      { icon: Shirt, hue: 'purple', title: 'Try it on', body: "Tap anything to try it. It's free.", mood: 'happy' },
    ],
  },
  profile: {
    title: 'Your profile',
    steps: [
      { icon: Trophy, hue: 'purple', title: 'Your progress', body: 'Streak, XP and badges, all here.', mood: 'cheer' },
      { icon: Settings2, hue: 'blue', title: 'Make it yours', body: 'Goal, location, dark mode. Change them anytime.', mood: 'happy' },
    ],
  },
};

export const isTourId = (name: string): name is TourId => name in TOURS;
