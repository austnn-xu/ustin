import { router } from 'expo-router';
import { Zap } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SceneryProp, SortingCenterArt } from '@/components/art/RouteArt';
import { RouteUnit } from '@/components/learn/RouteUnit';
import { StatsBar } from '@/components/StatsBar';
import { Button, Card, Icon, ProgressBar, Screen, Text } from '@/components/ui';
import { nextLesson } from '@/lib/course';
import { dayKey } from '@/lib/dates';
import { lessons } from '@/lib/engine';
import { currentStreak, useProgress } from '@/stores/progress';
import { useSettings } from '@/stores/settings';
import { makeStyles, useTheme } from '@/theme';

/**
 * Learn: the course as a recycling route through town. Each unit is a neighbourhood with its own road sign; each
 * lesson is a wheelie bin by the road; Tin's truck waits at the next stop.
 */
export default function Learn() {
  const t = useTheme();
  const styles = useStyles();
  const { width: screen } = useWindowDimensions();
  const width = Math.min(screen, t.layout.maxWidth);
  const records = useProgress((s) => s.lessons);
  const streak = useProgress((s) => s.streak);
  const xpToday = useProgress((s) => s.xpByDay[dayKey()] ?? 0);
  const goal = useSettings((s) => s.dailyGoal);
  const current = nextLesson(records);
  const [selected, setSelected] = useState<string | null>(current?.id ?? null);

  // Scroll so the truck (the current stop) is in view on open.
  const scroll = useRef<ScrollView>(null);
  const unitY = useRef<Record<string, number>>({});
  const scrolled = useRef(false);
  const scrollToCurrent = (unitId: string, y: number) => {
    if (scrolled.current) return;
    const base = unitY.current[unitId];
    if (base === undefined) return;
    scrolled.current = true;
    requestAnimationFrame(() => scroll.current?.scrollTo({ y: Math.max(0, base + y - t.space[20] * 3), animated: false }));
  };

  const { count, doneToday } = currentStreak(streak);
  const truckSays = doneToday ? 'Nice haul today!' : count > 0 ? `Your ${count}-day streak is waiting!` : "Hop in, let's sort!";

  return (
    <Screen gutter={false} header={<StatsBar />} background={t.colors.scene.sky}>
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sky}>
          <View style={[styles.cloud, styles.cloudLeft]}>
            <SceneryProp kind="cloud" size={t.layout.route.prop * 1.4} hue="blue" />
          </View>
          <View style={[styles.cloud, styles.cloudRight]}>
            <SceneryProp kind="cloud" size={t.layout.route.prop} hue="blue" />
          </View>
          <View style={styles.column}>
            <TodaysHaul xp={xpToday} goal={goal} />
          </View>
        </View>

        {lessons.UNITS.map((unit) => (
          <View
            key={unit.id}
            onLayout={(e) => {
              unitY.current[unit.id] = e.nativeEvent.layout.y;
            }}
          >
            <RouteUnit
              unit={unit}
              width={width}
              records={records}
              currentId={current?.id ?? null}
              selectedId={selected}
              onSelect={setSelected}
              truckSays={truckSays}
              onCurrentLayout={(y) => scrollToCurrent(unit.id, y)}
            />
          </View>
        ))}

        <EndOfTheRoad done={!current} />
      </ScrollView>
    </Screen>
  );
}

/** The daily goal, as today's haul. */
function TodaysHaul({ xp, goal }: { xp: number; goal: number }) {
  const styles = useStyles();
  const reached = xp >= goal;
  return (
    <Card style={styles.goal}>
      <View style={styles.goalRow}>
        <Icon icon={Zap} hue="yellow" filled />
        <Text variant="bodyStrong" style={styles.flex}>
          {reached ? "Today's haul: done!" : "Today's haul"}
        </Text>
        <Text variant="bodyStrong" hue="yellow" tabular>
          {`${Math.min(xp, goal)} / ${goal} XP`}
        </Text>
      </View>
      <ProgressBar value={xp / goal} hue="yellow" accessibilityLabel="Daily goal progress" />
    </Card>
  );
}

function EndOfTheRoad({ done }: { done: boolean }) {
  const t = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.end}>
      <View style={styles.column}>
        <Card style={styles.finish}>
          <SortingCenterArt hue="green" locked={!done} done={done} size={t.layout.route.truck * 1.2} />
          <Text variant="heading" align="center">
            {done ? 'You finished the whole route!' : 'The end of the route'}
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            {done
              ? 'Keep your streak going by sorting real things with What bin?'
              : 'Finish all 11 routes to master the full catalog: 177 everyday items.'}
          </Text>
          {done && <Button label="What bin?" variant="secondary" onPress={() => router.push('/scan')} />}
        </Card>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  content: { paddingBottom: 0 },
  sky: { paddingTop: t.space[3], paddingBottom: t.space[6] },
  cloud: { position: 'absolute' },
  cloudLeft: { top: t.space[16], left: -t.space[3] },
  cloudRight: { top: t.space[2], right: t.space[4] },
  column: { width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center', paddingHorizontal: t.layout.gutter },
  goal: { gap: t.space[3] },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
  flex: { flex: 1 },
  end: { backgroundColor: t.colors.bgSubtle, paddingVertical: t.space[8] },
  finish: { alignItems: 'center', gap: t.space[3], padding: t.space[6] },
}));
