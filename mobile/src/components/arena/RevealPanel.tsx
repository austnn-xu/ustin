import { Check, Flame, Timer, X } from 'lucide-react-native';
import { useEffect } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BIN } from '@/components/art/Bin';
import { Mascot } from '@/components/art/Mascot';
import { Button, Chip, Icon, Text } from '@/components/ui';
import type { Exercise } from '@/lib/engine';
import { makeStyles, useTheme, type HueName } from '@/theme';
import { Avatar } from './Avatar';

export type Standing = { name: string; paint: HueName; score: number; isMe: boolean; note?: string };

export type RevealPanelProps = {
  result: 'correct' | 'wrong' | 'timeout';
  title: string;
  /** The right answer, spelled out — shown when it was missed. */
  answer: string;
  explain: Exercise['explain'];
  points: number;
  streakBonus: number;
  /** You and your rival, after this question. Kahoot-style: the race between every question. */
  standings: Standing[];
  showTin: boolean;
  continueLabel: string;
  onContinue: () => void;
};

const fmt = (n: number) => n.toLocaleString('en-US');

/**
 * Rises after each answer: right or wrong, the points it scored, the answer and why (a match still teaches), and the
 * standings. The panel rising is the one motion; Tin's face carries the feeling.
 */
export function RevealPanel({ result, title, answer, explain, points, streakBonus, standings, showTin, continueLabel, onContinue }: RevealPanelProps) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const correct = result === 'correct';
  const hueName: HueName = correct ? 'green' : 'red';
  const hue = t.colors.hue[hueName];
  const rise = useSharedValue(1);

  useEffect(() => {
    rise.value = withSpring(0, t.motion.spring.gentle);
  }, [rise, t.motion.spring.gentle]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: rise.value * height * 0.5 }] }));
  const bin = explain.outcome ? BIN[explain.outcome] : null;
  const leader = standings.length > 1 ? [...standings].sort((a, b) => b.score - a.score)[0] : null;

  return (
    <Animated.View
      style={[styles.panel, { backgroundColor: hue.subtle, paddingBottom: Math.max(insets.bottom, t.space[4]) }, style]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.column}>
        <View style={styles.head}>
          <View style={[styles.badge, { backgroundColor: hue.base }]}>
            <Icon icon={correct ? Check : result === 'timeout' ? Timer : X} size="lg" color="onColor" />
          </View>
          <View style={styles.flex}>
            <Text variant="title" hue={hueName}>
              {title}
            </Text>
            {correct ? (
              <View style={styles.points}>
                <Text variant="bodyStrong" hue="green" tabular>{`+${fmt(points)} points`}</Text>
                {streakBonus > 0 && (
                  <View style={styles.streak}>
                    <Icon icon={Flame} size="sm" hue="orange" filled />
                    <Text variant="callout" hue="orange" tabular>{`+${streakBonus} streak`}</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text variant="bodyStrong" hue={hueName}>
                {`Answer: ${answer}`}
              </Text>
            )}
          </View>
          {showTin && <Mascot mood={correct ? 'cheer' : 'worried'} size="sm" />}
        </View>

        <ScrollView style={{ maxHeight: height * 0.18 }} contentContainerStyle={styles.why}>
          {bin && (
            <View style={styles.chips}>
              <Chip label={bin.short} icon={bin.icon} hue={bin.hue} onTint />
              {explain.stream && <Chip label={`${explain.stream.code} · ${explain.stream.label}`} onTint />}
            </View>
          )}
          <Text variant="body" hue={hueName}>
            {explain.text}
          </Text>
          {explain.source && <Text variant="caption" hue={hueName}>{`Source: ${explain.source}`}</Text>}
        </ScrollView>

        <View style={styles.standings} accessibilityLabel="Standings">
          {standings.map((s) => (
            <View key={s.name + s.isMe} style={styles.standing}>
              <Avatar name={s.name} paint={s.paint} size="sm" own={s.isMe} />
              <View style={styles.flex}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {s.isMe ? 'You' : s.name}
                </Text>
                {s.note && (
                  <Text variant="caption" color="textSecondary" numberOfLines={1}>
                    {s.note}
                  </Text>
                )}
              </View>
              {leader && leader === s && standings[0]!.score !== standings[1]!.score && <Chip label="Leading" size="sm" hue="yellow" />}
              <Text variant="heading" tabular>
                {fmt(s.score)}
              </Text>
            </View>
          ))}
        </View>

        <Button label={continueLabel} hue={hueName} fullWidth onPress={onContinue} />
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  panel: { paddingTop: t.space[5] },
  column: { width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center', paddingHorizontal: t.layout.gutter, gap: t.space[3] },
  head: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  badge: {
    width: t.layout.control.md,
    height: t.layout.control.md,
    borderRadius: t.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, minWidth: 0 },
  points: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: t.space[3] },
  streak: { flexDirection: 'row', alignItems: 'center', gap: t.space[1] },
  why: { gap: t.space[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] },
  standings: {
    gap: t.space[2],
    padding: t.space[3],
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
  },
  standing: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
}));
