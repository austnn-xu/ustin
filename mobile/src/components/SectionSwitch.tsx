import { router } from 'expo-router';
import { Segmented } from '@/components/arena/Segmented';

/** The tabs that hold two screens, and the two screens each holds (see TabBar). */
const PAIRS = {
  find: [
    { value: 'scan', label: 'What bin?' },
    { value: 'nearby', label: 'Near me' },
  ],
  you: [
    { value: 'profile', label: 'Profile' },
    { value: 'shop', label: 'Shop' },
  ],
} as const;

type Screen = (typeof PAIRS)[keyof typeof PAIRS][number]['value'];

/**
 * The switch at the top of a two-screen tab: What bin? ⇄ Near me, Profile ⇄ Shop. Each side is its own route, so it
 * keeps its own scroll and state, and the switch is a plain tab change (no slide: you flip between them constantly).
 */
export function SectionSwitch({ current }: { current: Screen }) {
  const pair = (PAIRS.find as readonly { value: Screen; label: string }[]).some((p) => p.value === current) ? PAIRS.find : PAIRS.you;
  return (
    <Segmented
      options={pair.map((p) => ({ value: p.value as Screen, label: p.label }))}
      value={current}
      onChange={(next) => {
        if (next !== current) router.navigate(`/${next}`);
      }}
      accessibilityLabel={pair === PAIRS.find ? 'What bin or Near me' : 'Profile or Shop'}
    />
  );
}
