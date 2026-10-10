import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Mascot } from '@/components/art/Mascot';
import { Appear, Button, Card, Icon, PressableScale, Text } from '@/components/ui';
import { isTourId, TOURS, type TourId } from '@/lib/tour';
import { useSettings } from '@/stores/settings';
import { easing, keyframes, makeStyles, useTheme } from '@/theme';

type Focusable = {
  isFocused: () => boolean;
  addListener: (event: 'focus' | 'blur', callback: () => void) => () => void;
};

/**
 * Wraps a tab. The first time someone opens it, Tin rises in on a sheet and walks them through what the tab is for and
 * how to use it, a step at a time; Skip or Got it marks it seen. Replay from Profile.
 */
export function TabTour({ id, navigation, children }: { id: string; navigation: Focusable; children: ReactNode }) {
  const t = useTheme();
  const seen = useSettings((s) => s.toursSeen.includes(id));
  const onboarded = useSettings((s) => s.onboarded);
  const focused = useSyncExternalStore(
    (onChange) => {
      const offFocus = navigation.addListener('focus', onChange);
      const offBlur = navigation.addListener('blur', onChange);
      return () => {
        offFocus();
        offBlur();
      };
    },
    () => navigation.isFocused(),
  );
  const wanted = isTourId(id) && onboarded && !seen && focused;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!wanted) {
      setOpen(false);
      return;
    }
    const timer = setTimeout(() => setOpen(true), t.motion.tourDelay);
    return () => clearTimeout(timer);
  }, [wanted, t.motion.tourDelay]);

  return (
    <View style={styles.fill}>
      {children}
      {open && isTourId(id) && <TourSheet id={id} />}
    </View>
  );
}

function TourSheet({ id }: { id: TourId }) {
  const t = useTheme();
  const s = useStyles();
  const finish = useSettings((st) => st.finishTour);
  const tour = TOURS[id];
  const [step, setStep] = useState(0);
  const current = tour.steps[step]!;
  const last = step === tour.steps.length - 1;
  const done = () => finish(id);

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View
        style={[
          s.scrim,
          { animationName: keyframes.fadeIn, animationDuration: t.motion.enter, animationTimingFunction: easing.out },
        ]}
      />
      <Appear spring="bouncy" style={s.sheetWrap}>
        <Card variant="floating" padding="lg" style={s.sheet}>
          <View style={s.head}>
            <Mascot mood={current.mood} size="sm" />
            <View style={s.flex}>
              <Text variant="label" color="textTertiary">
                {`${tour.title} · ${step + 1} of ${tour.steps.length}`}
              </Text>
              <Text variant="heading">{current.title}</Text>
            </View>
            {!last && (
              <PressableScale onPress={done} haptic="selection" accessibilityLabel="Skip the tour" hitSlop={t.space[2]}>
                <Text variant="bodyStrong" color="textTertiary">
                  Skip
                </Text>
              </PressableScale>
            )}
          </View>

          {/* Each step slides in from the right, like turning a page. */}
          <Appear key={step} from="right" style={s.body}>
            <View style={[s.iconTile, { backgroundColor: t.colors.hue[current.hue].subtle }]}>
              <Icon icon={current.icon} hue={current.hue} size="lg" />
            </View>
            <Text variant="body" color="textSecondary" style={s.flex}>
              {current.body}
            </Text>
          </Appear>

          <View style={s.foot}>
            <View style={s.dots} accessibilityLabel={`Step ${step + 1} of ${tour.steps.length}`}>
              {tour.steps.map((_, i) => (
                <View key={i} style={[s.dot, i === step && s.dotOn, i < step && s.dotDone]} />
              ))}
            </View>
            <Button label={last ? 'Got it' : 'Next'} onPress={last ? done : () => setStep(step + 1)} />
          </View>
        </Card>
      </Appear>
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });

const useStyles = makeStyles((t) => ({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.colors.scrim },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', padding: t.layout.gutter },
  sheet: { gap: t.space[4], width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  flex: { flex: 1 },
  body: { flexDirection: 'row', alignItems: 'flex-start', gap: t.space[4] },
  iconTile: {
    width: t.layout.control.lg,
    height: t.layout.control.lg,
    borderRadius: t.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[4] },
  dots: { flexDirection: 'row', gap: t.space[1.5] },
  dot: { width: t.layout.dot, height: t.layout.dot, borderRadius: t.radius.pill, backgroundColor: t.colors.fillStrong },
  dotOn: { width: t.layout.dot * 3, backgroundColor: t.colors.hue.green.base },
  dotDone: { backgroundColor: t.colors.hue.green.base },
}));
