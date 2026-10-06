import { router } from 'expo-router';
import { Flame, Heart, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Icon, PressableScale, Text } from '@/components/ui';
import { dayKey } from '@/lib/dates';
import { currentStreak, heartsNow, useProgress } from '@/stores/progress';
import { makeStyles } from '@/theme';

/** Re-render every `ms` so countdowns and refills stay live. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Streak · XP · hearts. The header of the Learn tab, like Duolingo's. */
export function StatsBar({ title }: { title?: string }) {
  const styles = useStyles();
  const now = useNow(30_000);
  const streak = useProgress((s) => s.streak);
  const xp = useProgress((s) => s.xp);
  const hearts = useProgress((s) => s.hearts);
  const heartsAt = useProgress((s) => s.heartsAt);
  const { count, doneToday } = currentStreak(streak, dayKey(new Date(now)));
  const live = heartsNow(hearts, heartsAt, now).hearts;

  return (
    <View style={styles.row}>
      {title ? (
        <Text variant="heading" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      ) : (
        <View style={styles.title} />
      )}
      <PressableScale
        onPress={() => router.push('/profile')}
        accessibilityLabel={`${count} day streak${doneToday ? '' : ', not yet extended today'}`}
        style={styles.pill}
      >
        <Icon icon={Flame} hue={doneToday ? 'orange' : undefined} color="textTertiary" filled={doneToday} />
        <Text variant="bodyStrong" hue={doneToday ? 'orange' : undefined} color="textTertiary" tabular>
          {count}
        </Text>
      </PressableScale>
      <PressableScale onPress={() => router.push('/profile')} accessibilityLabel={`${xp} XP`} style={styles.pill}>
        <Icon icon={Zap} hue="yellow" filled />
        <Text variant="bodyStrong" hue="yellow" tabular>
          {xp}
        </Text>
      </PressableScale>
      <View accessibilityLabel={`${live} hearts`} style={styles.pill}>
        <Icon icon={Heart} hue="red" filled />
        <Text variant="bodyStrong" hue="red" tabular>
          {live}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[2], paddingVertical: t.space[2] },
  title: { flex: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: t.space[1], paddingHorizontal: t.space[2], minHeight: t.layout.hitTarget },
}));
