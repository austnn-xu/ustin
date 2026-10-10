import type { LucideIcon } from 'lucide-react-native';
import {
  Camera,
  CircleCheck,
  Coins,
  Flame,
  ListChecks,
  MapPin,
  Navigation,
  Search,
  Settings2,
  Shirt,
  Split,
  Star,
  Trophy,
} from 'lucide-react-native';
import type { Mood } from '@/components/art/Mascot';
import type { HueName } from '@/theme';
import { rules } from './engine';
import { COINS } from './cosmetics';
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
export type TourId = 'index' | 'scan' | 'nearby' | 'shop' | 'profile';

/**
 * The tour of the main app: the first time you open each tab, Tin walks you through what it is for and exactly how to
 * use it, in two or three steps. Every claim here matches what the screen really does.
 */
export const TOURS: Record<TourId, { title: string; steps: TourStep[] }> = {
  index: {
    title: 'Your route',
    steps: [
      {
        icon: Star,
        hue: 'green',
        title: 'Each bin is a lesson',
        body: 'Tap the bin with the Start tag, then Start. Every lesson takes about five minutes.',
        mood: 'happy',
      },
      {
        icon: CircleCheck,
        hue: 'blue',
        title: 'Finish a stop, drive on',
        body: 'Done stops get stars and the truck moves to the next one. A sorting centre at the end of each neighbourhood reviews everything in it.',
        mood: 'cheer',
      },
      {
        icon: Flame,
        hue: 'orange',
        title: 'Keep the streak burning',
        body: 'Your streak, coins and XP sit at the top. One lesson or one lookup a day keeps the streak going.',
        mood: 'wow',
      },
    ],
  },
  scan: {
    title: 'What bin?',
    steps: [
      {
        icon: Search,
        hue: 'blue',
        title: 'Look anything up',
        body: `Holding something right now? Type what it is. I know ${rules.OBJECTS.length} everyday things, from pizza boxes to batteries.`,
        mood: 'happy',
      },
      visionSupported
        ? {
            icon: Camera,
            hue: 'blue',
            title: 'Or show me a photo',
            body: 'Tap Camera or Upload. I recognise it right here on your phone; the photo never leaves it.',
            mood: 'thinking',
          }
        : {
            icon: ListChecks,
            hue: 'blue',
            title: 'One question at most',
            body: 'If the answer depends on something, like whether a pizza box is greasy, I ask. Otherwise you get the answer straight away.',
            mood: 'thinking',
          },
      {
        icon: Split,
        hue: 'green',
        title: 'Every part, and why',
        body: 'Most things are a few materials. I show where each part goes, down to the plastic number, and the reason.',
        mood: 'cheer',
      },
    ],
  },
  nearby: {
    title: 'Near me',
    steps: [
      {
        icon: MapPin,
        hue: 'orange',
        title: 'For things no bin takes',
        body: 'Batteries, paint, old phones, medicine. Pick what you are getting rid of from the row of chips.',
        mood: 'thinking',
      },
      {
        icon: CircleCheck,
        hue: 'green',
        title: 'Real places, honestly marked',
        body: 'The nearest places come from OpenStreetMap. "Listed as accepting this" means the map says so; an orange note means they usually do, so call ahead.',
        mood: 'happy',
      },
      {
        icon: Navigation,
        hue: 'blue',
        title: 'Get there',
        body: 'Tap a place on the map or in the list, then Directions. Set your ZIP code here first if you have not yet.',
        mood: 'cheer',
      },
    ],
  },
  shop: {
    title: 'The shop',
    steps: [
      {
        icon: Coins,
        hue: 'yellow',
        title: 'Coins come from lessons',
        body: `${COINS.correct} coin for every right answer, +${COINS.combo5} for 5 in a row and +${COINS.combo10} for 10 in a row.`,
        mood: 'wow',
      },
      {
        icon: Shirt,
        hue: 'purple',
        title: 'Try before you buy',
        body: 'Tap any hat, glasses, neckwear or paint job and I will put it on, free, so you can see it first.',
        mood: 'happy',
      },
      {
        icon: Star,
        hue: 'green',
        title: 'I wear it everywhere',
        body: 'Buy it and I keep it on: on the route, in lessons and when I answer your questions.',
        mood: 'cheer',
      },
    ],
  },
  profile: {
    title: 'Your profile',
    steps: [
      {
        icon: Trophy,
        hue: 'purple',
        title: 'Everything you have done',
        body: 'Your streak, XP, lessons, items sorted and badges, all in one place.',
        mood: 'cheer',
      },
      {
        icon: Settings2,
        hue: 'blue',
        title: 'Make it yours',
        body: 'Change your daily goal, where you live or light and dark mode any time. You can also replay this tour from here.',
        mood: 'happy',
      },
    ],
  },
};

export const isTourId = (name: string): name is TourId => name in TOURS;
