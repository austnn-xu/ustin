import type { DailyGoal } from '@/stores/settings';

export const GOALS: { value: DailyGoal; label: string; blurb: string }[] = [
  { value: 10, label: 'Casual', blurb: '1 lesson a day' },
  { value: 20, label: 'Regular', blurb: '2 lessons a day' },
  { value: 30, label: 'Serious', blurb: '3 lessons a day' },
  { value: 50, label: 'Intense', blurb: '5 lessons a day' },
];
