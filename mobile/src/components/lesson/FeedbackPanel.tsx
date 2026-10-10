import { Check, X } from 'lucide-react-native';
import { useEffect } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BIN } from '@/components/art/Bin';
import { Coin } from '@/components/art/Coin';
import { Mascot } from '@/components/art/Mascot';
import { Appear, Button, Chip, Icon, Text } from '@/components/ui';
import type { Exercise } from '@/lib/engine';
import { makeStyles, useTheme } from '@/theme';
import { CoachTip } from './CoachTip';

export type FeedbackPanelProps = {
  correct: boolean;
  title: string;
  /** The right answer, spelled out — shown when the user got it wrong. */
  answer: string;
  explain: Exercise['explain'];
  showTin: boolean;
  /** Coins the answer earned, if it was right. */
  payout?: { total: number; bonus: number } | null;
  /** First lesson only: point out that the explanation is the lesson, and what to tap next. */
  coach?: boolean;
  onContinue: () => void;
};

/**
 * The panel that slides up after CHECK. Green and cheering when right; red, gentle and explaining when wrong —
 * the explanation is the actual lesson, so it is shown either way. The badge lands after the panel: a tick that spins
 * in, or a cross that shakes its head.
 */
export function FeedbackPanel({ correct, title, answer, explain, showTin, payout, coach, onContinue }: FeedbackPanelProps) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const hueName = correct ? 'green' : 'red';
  const hue = t.colors.hue[hueName];
  const rise = useSharedValue(1);
  const land = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    rise.value = withSpring(0, t.motion.spring.gentle);
    land.value = withDelay(t.motion.stagger * 2, withSpring(1, t.motion.spring.bouncy));
    if (!correct) shake.value = withDelay(t.motion.stagger * 4, withSequence(withTiming(1, { duration: 0 }), withSpring(0, t.motion.spring.wobble)));
  }, [rise, land, shake, correct, t.motion.spring, t.motion.stagger]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: rise.value * height * 0.5 }] }));
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value * t.space[1] },
      { scale: land.value },
      { rotate: `${(1 - land.value) * (correct ? -120 : 90)}deg` },
    ],
  }));
  const bin = explain.outcome ? BIN[explain.outcome] : null;

  return (
    <Animated.View
      style={[styles.panel, { backgroundColor: hue.subtle, paddingBottom: Math.max(insets.bottom, t.space[4]) }, style]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.column}>
        <View style={styles.head}>
          <Animated.View style={[styles.badge, { backgroundColor: hue.base }, badgeStyle]}>
            <Icon icon={correct ? Check : X} size="lg" color="onColor" />
          </Animated.View>
          <View style={styles.flex}>
            <Text variant="title" hue={hueName}>
              {title}
            </Text>
            {!correct && (
              <Text variant="bodyStrong" hue={hueName}>
                {`Answer: ${answer}`}
              </Text>
            )}
            {payout && (
              <Appear from="pop" spring="bouncy" index={4} style={styles.payout}>
                <Coin size={t.layout.icon.md} />
                <Text variant="bodyStrong" hue="yellow">
                  {payout.bonus ? `+${payout.total} coins (+${payout.bonus} bonus!)` : `+${payout.total} coin`}
                </Text>
              </Appear>
            )}
          </View>
          {showTin && <Mascot mood={correct ? 'cheer' : 'worried'} size="sm" />}
        </View>

        <ScrollView style={{ maxHeight: height * 0.26 }} contentContainerStyle={styles.why}>
          {(bin || explain.stream) && (
            <View style={styles.chips}>
              {bin && <Chip label={BIN[explain.outcome!].short} icon={bin.icon} hue={bin.hue} onTint />}
              {explain.stream && <Chip label={`${explain.stream.code} · ${explain.stream.label}`} onTint />}
              {explain.stream && (
                <Chip
                  onTint
                  label={explain.stream.acceptance}
                  hue={explain.stream.acceptance.startsWith('Widely') ? 'green' : explain.stream.acceptance.startsWith('Rarely') ? 'red' : 'orange'}
                />
              )}
            </View>
          )}
          <Text variant="body" hue={hueName}>
            {explain.text}
          </Text>
        </ScrollView>

        {coach && <CoachTip>{correct ? 'The why is the lesson. Tap Continue' : 'Mistakes are free. Read why, then Continue'}</CoachTip>}
        <Button label="Continue" hue={hueName} fullWidth onPress={onContinue} />
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
  flex: { flex: 1 },
  payout: { flexDirection: 'row', alignItems: 'center', gap: t.space[1], marginTop: t.space[0.5] },
  why: { gap: t.space[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] },
}));
