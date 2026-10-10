import type { LucideIcon } from 'lucide-react-native';
import { Check, Flame, Target, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { Coin } from '@/components/art/Coin';
import { Confetti } from '@/components/art/Confetti';
import { Mascot } from '@/components/art/Mascot';
import { MascotSays } from '@/components/MascotSays';
import { Appear, Button, Card, Icon, Screen, Text } from '@/components/ui';
import type { Achievement } from '@/lib/achievements';
import { dayKey, lastWeek, weekdayLetter } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { useProgress } from '@/stores/progress';
import { easing, keyframes, makeStyles, useTheme, type HueName } from '@/theme';
import { useScreenSize } from '@/lib/useScreenSize';

/** Counts up to `to` once, after `delay` ms, for celebratory numbers. */
function useCountUp(to: number, ms = 900, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now + delay;
      const p = Math.max(0, Math.min(1, (now - start) / ms));
      setValue(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, ms, delay]);
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
  // Count up once each tile has landed.
  const xp = useCountUp(summary.xp, 900, t.motion.stagger * 4);
  const coins = useCountUp(summary.coins, 900, t.motion.stagger * 6);
  const title = summary.perfect ? 'Perfect lesson!' : summary.accuracy >= 0.8 ? 'Lesson complete!' : 'You made it!';
  const line = summary.perfect
    ? 'Not a single mistake. You really know your bins.'
    : summary.accuracy >= 0.8
      ? 'Great sorting. Every right answer keeps something out of landfill.'
      : 'The tricky ones are the ones worth learning. You will get them next time.';

  return (
    <Screen scroll footer={<Button label="Continue" fullWidth onPress={onContinue} />}>
      {/* The celebration builds: Tin jumps, the headline lands, then each stat pops in on its own beat. */}
      <View style={styles.center}>
        <Mascot mood="cheer" size={short ? 'md' : summary.badges.length ? 'lg' : 'xl'} pokeable />
        <Appear from="pop" spring="bouncy" index={1}>
          <Text variant="display" hue="yellow" align="center">
            {title}
          </Text>
        </Appear>
        <Appear index={2}>
          <Text variant="body" color="textSecondary" align="center">
            {line}
          </Text>
        </Appear>
        <View style={styles.tiles}>
          <Appear from="pop" spring="bouncy" index={4} style={styles.flex}>
            <StatTile label="Total XP" value={`${xp}`} icon={Zap} hue="yellow" />
          </Appear>
          <Appear from="pop" spring="bouncy" index={6} style={styles.flex}>
            <StatTile label="Coins" value={`${coins}`} hue="orange" art={<Coin size={t.layout.icon.md} />} />
          </Appear>
          <Appear from="pop" spring="bouncy" index={8} style={styles.flex}>
            <StatTile label="Accuracy" value={`${Math.round(summary.accuracy * 100)}%`} icon={Target} hue="green" />
          </Appear>
        </View>
        {summary.goalReached && (
          <Appear index={10} style={styles.stretch}>
            <Card variant="tinted" hue="yellow" style={styles.note}>
              <Icon icon={Zap} hue="yellow" filled />
              <Text variant="bodyStrong" hue="yellow" style={styles.flex}>
                Daily goal reached!
              </Text>
            </Card>
          </Appear>
        )}
        {summary.badges.length > 0 && (
          <Appear index={11} style={styles.stretch}>
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
          </Appear>
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
        <Appear from="pop" spring="bouncy" style={styles.flame}>
          <Flicker>
            <Flame size={t.layout.mascot.lg} color={t.colors.hue.orange.depth} fill={t.colors.hue.orange.base} strokeWidth={t.layout.iconStroke} />
          </Flicker>
        </Appear>
        <Appear from="pop" spring="bouncy" index={2}>
          <Text variant="hero" hue="orange" align="center" tabular>
            {count}
          </Text>
        </Appear>
        <Appear index={3}>
          <Text variant="title" hue="orange" align="center">
            day streak!
          </Text>
        </Appear>
        <Appear index={5} style={styles.stretch}>
          <Card style={styles.week}>
            <View style={styles.weekRow}>
              {lastWeek(today).map((d, i) => {
                const active = (xpByDay[d] ?? 0) > 0;
                return (
                  <View key={d} style={styles.day}>
                    <Text variant="label" color={d === today ? 'text' : 'textTertiary'}>
                      {weekdayLetter(d)}
                    </Text>
                    {/* The days tick on one by one, today last and with the biggest bounce. */}
                    <Appear from="pop" spring="bouncy" index={7 + i} delay={d === today ? t.motion.stagger * 3 : 0}>
                      <View style={[styles.dot, active && styles.dotOn]}>{active && <Icon icon={Check} size="sm" color="onColor" />}</View>
                    </Appear>
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
        </Appear>
      </View>
    </Screen>
  );
}

/** A flame that never sits still: it breathes and leans, a CSS loop like a real fire. */
function Flicker({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const reduced = useReducedMotion();
  return (
    <Animated.View
      style={
        !reduced && {
          animationName: keyframes.flicker,
          animationDuration: t.motion.pulseDuration / 2,
          animationTimingFunction: easing.sine,
          animationIterationCount: 'infinite',
          animationDirection: 'alternate',
        }
      }
    >
      {children}
    </Animated.View>
  );
}

/** "Wait, don't go!" — shown when closing a lesson part-way. The sheet springs up over a fading scrim. */
export function QuitConfirm({ onStay, onQuit }: { onStay: () => void; onQuit: () => void }) {
  const t = useTheme();
  const styles = useStyles();
  const p = useSharedValue(0);
  useEffect(() => {
    haptics.medium();
    p.value = withSpring(1, t.motion.spring.gentle);
  }, [p, t.motion.spring.gentle]);
  const scrim = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value) }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - p.value) * t.space[20] * 3 }] }));
  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.scrimFill, scrim]} />
      <Animated.View style={[styles.sheetWrap, sheet]}>
        <Card variant="floating" padding="lg" style={styles.sheet}>
          <MascotSays mood="sad" size="md">
            Wait, don&apos;t go! You will lose your progress in this lesson.
          </MascotSays>
          <View style={styles.buttons}>
            <Button label="Keep learning" variant="secondary" fullWidth onPress={onStay} />
            <Button label="End session" variant="ghost" hue="orange" fullWidth onPress={onQuit} />
          </View>
        </Card>
      </Animated.View>
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
  note: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  badges: { gap: t.space[2] },
  badge: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  flex: { flex: 1 },
  flame: { marginBottom: -t.space[6] },
  week: { gap: t.space[3], marginTop: t.space[4] },
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: t.layout.gutter,
  },
  scrimFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.colors.scrim },
  sheetWrap: { width: '100%' },
  stretch: { alignSelf: 'stretch' },
  sheet: { gap: t.space[5], width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center', marginBottom: t.space[6] },
}));
