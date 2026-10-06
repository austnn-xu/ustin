import type { LucideIcon } from 'lucide-react-native';
import { Check, Flame, Target, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Coin } from '@/components/art/Coin';
import { Confetti } from '@/components/art/Confetti';
import { Mascot } from '@/components/art/Mascot';
import { MascotSays } from '@/components/MascotSays';
import { Button, Card, Icon, Screen, Text } from '@/components/ui';
import type { Achievement } from '@/lib/achievements';
import { dayKey, lastWeek, weekdayLetter } from '@/lib/dates';
import { useProgress } from '@/stores/progress';
import { makeStyles, useTheme, type HueName } from '@/theme';
import { useScreenSize } from '@/lib/useScreenSize';

/** Counts up to `to` once, for celebratory numbers. */
function useCountUp(to: number, ms = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const p = Math.min(1, (now - start) / ms);
      setValue(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, ms]);
  return value;
}

function StatTile({ label, value, icon, hue, art }: { label: string; value: string; icon?: LucideIcon; hue: HueName; art?: React.ReactNode }) {
  const t = useTheme();
  const styles = useStyles();
  const h = t.colors.hue[hue];
  return (
    <View style={[styles.tile, { backgroundColor: h.base, borderColor: h.base }]}>
      <Text variant="label" align="center" style={styles.tileLabel}>
        {label}
      </Text>
      <View style={styles.tileBody}>
        {art ?? (icon && <Icon icon={icon} hue={hue} filled={icon === Zap} />)}
        <Text variant="heading" hue={hue} tabular>
          {value}
        </Text>
      </View>
    </View>
  );
}

export type LessonSummary = {
  xp: number;
  coins: number;
  accuracy: number;
  seconds: number;
  perfect: boolean;
  goalReached: boolean;
  badges: Achievement[];
};

export function LessonComplete({ summary, onContinue }: { summary: LessonSummary; onContinue: () => void }) {
  const styles = useStyles();
  const t = useTheme();
  const { short } = useScreenSize();
  const xp = useCountUp(summary.xp);
  const coins = useCountUp(summary.coins);
  const title = summary.perfect ? 'Perfect lesson!' : summary.accuracy >= 0.8 ? 'Lesson complete!' : 'You made it!';
  const line = summary.perfect
    ? 'Not a single mistake. You really know your bins.'
    : summary.accuracy >= 0.8
      ? 'Great sorting. Every right answer keeps something out of landfill.'
      : 'The tricky ones are the ones worth learning. You will get them next time.';

  return (
    <Screen scroll footer={<Button label="Continue" fullWidth onPress={onContinue} />}>
      <View style={styles.center}>
        <Mascot mood="cheer" size={short ? 'md' : summary.badges.length ? 'lg' : 'xl'} />
        <Text variant="display" hue="yellow" align="center">
          {title}
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          {line}
        </Text>
        <View style={styles.tiles}>
          <StatTile label="Total XP" value={`${xp}`} icon={Zap} hue="yellow" />
          <StatTile label="Coins" value={`${coins}`} hue="orange" art={<Coin size={t.layout.icon.md} />} />
          <StatTile label="Accuracy" value={`${Math.round(summary.accuracy * 100)}%`} icon={Target} hue="green" />
        </View>
        {summary.goalReached && (
          <Card variant="tinted" hue="yellow" style={styles.note}>
            <Icon icon={Zap} hue="yellow" filled />
            <Text variant="bodyStrong" hue="yellow" style={styles.flex}>
              Daily goal reached!
            </Text>
          </Card>
        )}
        {summary.badges.length > 0 && (
          <Card variant="tinted" hue="purple" style={styles.badges}>
            <Text variant="label" hue="purple">
              {summary.badges.length === 1 ? 'New badge' : `${summary.badges.length} new badges`}
            </Text>
            {summary.badges.map((b) => (
              <View key={b.id} style={styles.badge}>
                <Icon icon={b.icon} hue={b.hue} />
                <Text variant="bodyStrong">{b.title}</Text>
              </View>
            ))}
          </Card>
        )}
      </View>
      <Confetti />
    </Screen>
  );
}

export function StreakCelebration({ streak, onContinue }: { streak: number; onContinue: () => void }) {
  const t = useTheme();
  const styles = useStyles();
  const xpByDay = useProgress((s) => s.xpByDay);
  const count = useCountUp(streak, 700);
  const today = dayKey();
  return (
    <Screen scroll footer={<Button label="Continue" fullWidth onPress={onContinue} />}>
      <View style={styles.center}>
        <View style={styles.flame}>
          <Flame size={t.layout.mascot.lg} color={t.colors.hue.orange.depth} fill={t.colors.hue.orange.base} strokeWidth={t.layout.iconStroke} />
        </View>
        <Text variant="hero" hue="orange" align="center" tabular>
          {count}
        </Text>
        <Text variant="title" hue="orange" align="center">
          day streak!
        </Text>
        <Card style={styles.week}>
          <View style={styles.weekRow}>
            {lastWeek(today).map((d) => {
              const active = (xpByDay[d] ?? 0) > 0;
              return (
                <View key={d} style={styles.day}>
                  <Text variant="label" color={d === today ? 'text' : 'textTertiary'}>
                    {weekdayLetter(d)}
                  </Text>
                  <View style={[styles.dot, active && styles.dotOn]}>{active && <Icon icon={Check} size="sm" color="onColor" />}</View>
                </View>
              );
            })}
          </View>
          <Text variant="callout" color="textSecondary" align="center">
            {streak === 1
              ? 'A new streak starts today. Come back tomorrow to grow it!'
              : 'Do a lesson or look up an item every day to keep it burning.'}
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

/** "Wait, don't go!" — shown when closing a lesson part-way. */
export function QuitConfirm({ onStay, onQuit }: { onStay: () => void; onQuit: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.scrim}>
      <Card variant="floating" padding="lg" style={styles.sheet}>
        <MascotSays mood="sad" size="md">
          Wait, don&apos;t go! You will lose your progress in this lesson.
        </MascotSays>
        <View style={styles.buttons}>
          <Button label="Keep learning" variant="secondary" fullWidth onPress={onStay} />
          <Button label="End session" variant="ghost" hue="orange" fullWidth onPress={onQuit} />
        </View>
      </Card>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[4], paddingVertical: t.space[6] },
  tiles: { flexDirection: 'row', gap: t.space[3], alignSelf: 'stretch', marginTop: t.space[4] },
  tile: { flex: 1, borderRadius: t.radius.lg, borderWidth: t.layout.border, overflow: 'hidden' },
  tileLabel: { color: t.colors.onColor, paddingVertical: t.space[1] },
  tileBody: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.space[1],
    paddingVertical: t.space[3],
  },
  note: { flexDirection: 'row', alignItems: 'center', gap: t.space[3], alignSelf: 'stretch' },
  badges: { alignSelf: 'stretch', gap: t.space[2] },
  badge: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  flex: { flex: 1 },
  flame: { marginBottom: -t.space[6] },
  week: { alignSelf: 'stretch', gap: t.space[3], marginTop: t.space[4] },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: t.space[1] },
  dot: {
    width: t.space[8],
    height: t.space[8],
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.fillStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { backgroundColor: t.colors.hue.orange.base },
  buttons: { gap: t.space[2], alignSelf: 'stretch' },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: t.colors.scrim,
    justifyContent: 'flex-end',
    padding: t.layout.gutter,
  },
  sheet: { gap: t.space[5], width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center', marginBottom: t.space[6] },
}));
