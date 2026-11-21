import { Timer } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { Icon, Text } from '@/components/ui';
import { drain, makeStyles, useTheme } from '@/theme';

/** The last few seconds turn the bar and the count red. */
const HURRY_SECONDS = 5;

/**
 * A question's clock: a bar that empties and the seconds left. The bar is one linear CSS animation, so it costs no
 * JavaScript per frame; only the seconds label re-renders, once a second, and it is the smallest leaf on screen.
 * Mount it with a new `key` per question. `running={false}` freezes it where it stands (the answer is in).
 */
export function MatchTimer({ ms, running, onExpire }: { ms: number; running: boolean; onExpire: () => void }) {
  const t = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const started = useRef(Date.now());
  const expire = useRef(onExpire);
  expire.current = onExpire;
  const [left, setLeft] = useState(Math.ceil(ms / 1000));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!running) return;
    const remaining = () => ms - (Date.now() - started.current);
    const tick = setInterval(() => setLeft(Math.max(0, Math.ceil(remaining() / 1000))), 250);
    const end = setTimeout(() => {
      setLeft(0);
      expire.current();
    }, Math.max(0, remaining()));
    return () => {
      clearInterval(tick);
      clearTimeout(end);
    };
  }, [running, ms]);

  const hurry = left <= HURRY_SECONDS;
  const hue = hurry ? 'red' : 'blue';
  const fill = t.colors.hue[hue].base;
  const elapsed = Date.now() - started.current;

  return (
    <View style={styles.row} accessibilityRole="timer" accessibilityLabel={`${left} seconds left`}>
      <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 &&
          (reduced ? (
            <View style={[styles.fill, { backgroundColor: fill, width: `${(left / (ms / 1000)) * 100}%` }]} />
          ) : (
            <Animated.View
              style={[
                styles.fill,
                {
                  backgroundColor: fill,
                  animationName: drain(width),
                  animationDuration: ms,
                  // If the bar is measured a moment after the clock started, start it that far along.
                  animationDelay: -Math.min(elapsed, ms),
                  animationTimingFunction: 'linear',
                  animationFillMode: 'forwards',
                  animationPlayState: running ? 'running' : 'paused',
                },
              ]}
            />
          ))}
      </View>
      <View style={styles.count}>
        <Icon icon={Timer} size="sm" hue={hue} shade="text" />
        <Text variant="bodyStrong" hue={hue} tabular>
          {left}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
  track: { flex: 1, height: t.layout.bar.sm, borderRadius: t.radius.pill, backgroundColor: t.colors.fillStrong, overflow: 'hidden' },
  fill: { height: '100%', width: '100%', borderRadius: t.radius.pill },
  count: { flexDirection: 'row', alignItems: 'center', gap: t.space[1], minWidth: t.space[10], justifyContent: 'flex-end' },
}));
