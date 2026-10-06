import { router } from 'expo-router';
import { Trophy, Zap } from 'lucide-react-native';
import { Fragment, useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SECTION_HUE } from '@/components/art/ItemArt';
import { Mascot, type Mood } from '@/components/art/Mascot';
import { LessonCard } from '@/components/learn/LessonCard';
import { PathNode } from '@/components/learn/PathNode';
import { UnitHeader } from '@/components/learn/UnitHeader';
import { StatsBar } from '@/components/StatsBar';
import { Button, Card, Icon, ProgressBar, Screen, Text } from '@/components/ui';
import { lessonState, nextLesson, unitProgress } from '@/lib/course';
import { dayKey } from '@/lib/dates';
import { lessons } from '@/lib/engine';
import { currentStreak, heartsNow, useProgress } from '@/stores/progress';
import { useSettings } from '@/stores/settings';
import { makeStyles, useTheme } from '@/theme';

/** The path winds: each lesson node is nudged left or right of center by this many steps. */
const PATTERN = [0, 1, 1.5, 1, 0, -1, -1.5, -1];

export default function Learn() {
  const t = useTheme();
  const styles = useStyles();
  const records = useProgress((s) => s.lessons);
  const streak = useProgress((s) => s.streak);
  const hearts = useProgress((s) => s.hearts);
  const heartsAt = useProgress((s) => s.heartsAt);
  const xpToday = useProgress((s) => s.xpByDay[dayKey()] ?? 0);
  const goal = useSettings((s) => s.dailyGoal);
  const current = nextLesson(records);
  const [selected, setSelected] = useState<string | null>(current?.id ?? null);

  // Scroll so the current lesson is in view on open.
  const scroll = useRef<ScrollView>(null);
  const unitY = useRef<Record<string, number>>({});
  const scrolled = useRef(false);
  const scrollToCurrent = (unitId: string, rowY: number) => {
    if (scrolled.current) return;
    const base = unitY.current[unitId];
    if (base === undefined) return;
    scrolled.current = true;
    const y = Math.max(0, base + rowY - t.space[20] * 2);
    requestAnimationFrame(() => scroll.current?.scrollTo({ y, animated: false }));
  };

  const { count, doneToday } = currentStreak(streak);
  const outOfHearts = heartsNow(hearts, heartsAt).hearts === 0;
  const mood: Mood = outOfHearts ? 'sad' : doneToday ? 'happy' : count > 0 ? 'worried' : 'happy';

  return (
    <Screen gutter={false} header={<StatsBar />}>
      <ScrollView ref={scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          <DailyGoal xp={xpToday} goal={goal} />

          {lessons.UNITS.map((unit) => {
            const progress = unitProgress(unit, records);
            const hue = SECTION_HUE[unit.id] ?? 'green';
            let regularIndex = -1;
            return (
              <View
                key={unit.id}
                style={styles.unit}
                onLayout={(e) => {
                  unitY.current[unit.id] = e.nativeEvent.layout.y;
                }}
              >
                <UnitHeader unit={unit} done={progress.done} total={progress.total} />
                {unit.lessons.map((lesson, i) => {
                  if (!lesson.review) regularIndex += 1;
                  const index = regularIndex;
                  const state = lessonState(lesson.id, records);
                  const offset = (PATTERN[i % PATTERN.length] ?? 0) * t.space[10];
                  const isCurrent = current?.id === lesson.id;
                  return (
                    <Fragment key={lesson.id}>
                      <View
                        style={[styles.row, i === 0 && styles.firstRow, isCurrent && i > 0 && styles.currentRow]}
                        onLayout={isCurrent ? (e) => scrollToCurrent(unit.id, e.nativeEvent.layout.y) : undefined}
                      >
                        <View style={{ transform: [{ translateX: offset }] }}>
                          <PathNode
                            state={state}
                            hue={hue}
                            review={lesson.review}
                            stars={records[lesson.id]?.stars ?? 0}
                            label={`${lesson.review ? 'Unit review' : `Lesson ${index + 1}`}, ${unit.title}, ${state}`}
                            selected={selected === lesson.id}
                            onPress={() => setSelected((s) => (s === lesson.id ? null : lesson.id))}
                          />
                        </View>
                        {isCurrent && (
                          <View style={[styles.tin, offset > 0 ? styles.tinLeft : styles.tinRight]} pointerEvents="none">
                            <Mascot mood={mood} size="md" hue={hue} />
                          </View>
                        )}
                      </View>
                      {selected === lesson.id && (
                        <View style={styles.card}>
                          <LessonCard unit={unit} lesson={lesson} index={index} state={state} />
                        </View>
                      )}
                    </Fragment>
                  );
                })}
              </View>
            );
          })}

          <Finish done={!current} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function DailyGoal({ xp, goal }: { xp: number; goal: number }) {
  const styles = useStyles();
  const reached = xp >= goal;
  return (
    <Card style={styles.goal}>
      <View style={styles.goalRow}>
        <Icon icon={Zap} hue="yellow" filled />
        <Text variant="bodyStrong" style={styles.goalTitle}>
          {reached ? 'Daily goal reached!' : 'Daily goal'}
        </Text>
        <Text variant="bodyStrong" hue="yellow" tabular>
          {`${Math.min(xp, goal)} / ${goal} XP`}
        </Text>
      </View>
      <ProgressBar value={xp / goal} hue="yellow" accessibilityLabel="Daily goal progress" />
    </Card>
  );
}

function Finish({ done }: { done: boolean }) {
  const styles = useStyles();
  return (
    <Card style={styles.finish}>
      <Icon icon={Trophy} size="xl" hue="yellow" filled={done} />
      <Text variant="heading" align="center">
        {done ? 'You finished the whole course!' : 'Every shelf, mastered'}
      </Text>
      <Text variant="body" color="textSecondary" align="center">
        {done
          ? 'Keep the streak alive by sorting real things with What bin?'
          : 'Finish all 11 units to master the full catalog: 177 everyday items.'}
      </Text>
      {done && <Button label="What bin?" variant="secondary" onPress={() => router.push('/scan')} />}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  content: { paddingBottom: t.space[16] },
  column: { width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center', paddingHorizontal: t.layout.gutter, gap: t.space[6] },
  goal: { gap: t.space[3] },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
  goalTitle: { flex: 1 },
  unit: { gap: t.space[4] },
  row: { alignItems: 'center', justifyContent: 'center', minHeight: t.layout.node.ring + t.space[4] },
  firstRow: { marginTop: t.space[10] },
  /** Room for the START bubble above the current node. */
  currentRow: { marginTop: t.space[8] },
  tin: { position: 'absolute', top: -t.space[2] },
  tinLeft: { left: t.space[2] },
  tinRight: { right: t.space[2] },
  card: { marginTop: -t.space[2] },
  finish: { alignItems: 'center', gap: t.space[3], padding: t.space[6] },
}));
