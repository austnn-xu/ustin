import { router } from 'expo-router';
import { View } from 'react-native';
import { SECTION_HUE } from '@/components/art/ItemArt';
import { Button, Text } from '@/components/ui';
import type { NodeState } from '@/lib/course';
import { rules, type Lesson, type Unit } from '@/lib/engine';
import { XP } from '@/stores/progress';
import { makeStyles, useTheme } from '@/theme';

/** The popover under a tapped stop on the route: what the lesson covers, and the button to start it. */
export function LessonCard({ unit, lesson, index, state }: { unit: Unit; lesson: Lesson; index: number; state: NodeState }) {
  const t = useTheme();
  const styles = useStyles();
  const hueName = SECTION_HUE[unit.id] ?? 'green';
  const hue = t.colors.hue[hueName];
  const locked = state === 'locked';
  const names = lesson.objects.map((id) => rules.findObject(id)?.label).filter(Boolean) as string[];
  const shown = lesson.review ? `Everything in ${unit.title}: ${names.length} items` : names.join(' · ');
  const xp = lesson.review ? XP.review : XP.lesson;
  const regular = unit.lessons.filter((l) => !l.review).length;

  return (
    <View style={[styles.card, locked ? styles.lockedCard : { backgroundColor: hue.base, borderBottomColor: hue.depth }]}>
      <Text variant="heading" style={!locked && styles.onColor} color="textSecondary">
        {lesson.review ? 'Sorting center: unit review' : `Stop ${index + 1} of ${regular}`}
      </Text>
      <Text variant="callout" style={!locked && styles.onColor} color="textTertiary" numberOfLines={3}>
        {locked ? 'Finish the stops before this one to unlock it.' : shown}
      </Text>
      {!locked && (
        <View style={styles.cta}>
          <Button
            label={state === 'done' ? `Practice +${xp} XP` : `Start +${xp} XP`}
            variant="neutral"
            labelHue={hueName}
            fullWidth
            onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}
          />
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    alignSelf: 'stretch',
    gap: t.space[1],
    borderRadius: t.radius.lg,
    padding: t.space[4],
    borderBottomWidth: t.layout.depth.md,
    ...t.shadow.lg,
  },
  lockedCard: { backgroundColor: t.colors.fill, borderBottomColor: t.colors.fillStrong },
  onColor: { color: t.colors.onColor },
  cta: { marginTop: t.space[3] },
}));
