import { Check, Square, SquareCheck, X } from 'lucide-react-native';
import { View } from 'react-native';
import { BIN, BinArt } from '@/components/art/Bin';
import { ItemArt } from '@/components/art/ItemArt';
import type { Mood } from '@/components/art/Mascot';
import { MascotSays } from '@/components/MascotSays';
import { ChoiceCard, Chip, Icon, Text, type ChoiceState } from '@/components/ui';
import type { Exercise, ExerciseChoice } from '@/lib/engine';
import { useScreenSize } from '@/lib/useScreenSize';
import { makeStyles, useTheme } from '@/theme';
import { ItemCard } from './ItemCard';

export type ExerciseViewProps = {
  exercise: Exercise;
  selected: string[];
  /** null until the answer is checked. */
  checked: boolean | null;
  onToggle: (choiceId: string) => void;
};

/**
 * Renders any generated exercise: its prompt, the item, and the right kind of answer tiles for its type. It arrives as
 * one piece (the lesson slides it in); nothing inside staggers, so the answers are tappable straight away.
 */
export function ExerciseView({ exercise, selected, checked, onToggle }: ExerciseViewProps) {
  const t = useTheme();
  const styles = useStyles();
  const { short } = useScreenSize();

  const stateOf = (c: ExerciseChoice): ChoiceState => {
    const isSelected = selected.includes(c.id);
    if (checked === null) return isSelected ? 'selected' : 'idle';
    if (exercise.answer.includes(c.id)) return 'correct';
    if (isSelected) return 'wrong';
    return 'dimmed';
  };

  const tile = (c: ExerciseChoice, children: React.ReactNode, style?: object, padding: 'md' | 'lg' = 'md') => (
    <View key={c.id} style={style}>
      <ChoiceCard
        state={stateOf(c)}
        disabled={checked !== null}
        onPress={() => onToggle(c.id)}
        accessibilityLabel={c.sublabel ? `${c.label}, ${c.sublabel}` : c.label}
        style={styles.fill}
        padding={padding}
      >
        {children}
      </ChoiceCard>
    </View>
  );
  const item = exercise.item && <ItemCard item={exercise.item} />;

  const mood: Mood = checked === null ? 'thinking' : checked ? 'cheer' : 'worried';

  return (
    <View style={styles.root}>
      <Text variant="title">{exercise.prompt}</Text>

      {exercise.type === 'truefalse' ? (
        <>
          {item}
          <MascotSays mood={mood} size="sm">
            {exercise.statement}
          </MascotSays>
          <View style={styles.grid}>
            {exercise.choices.map((c) =>
              tile(
                c,
                <View style={styles.center}>
                  <Icon icon={c.id === 'true' ? Check : X} size="xl" hue={c.id === 'true' ? 'green' : 'red'} />
                  <Text variant="heading">{c.label}</Text>
                </View>,
                styles.half,
                'lg',
              ),
            )}
          </View>
        </>
      ) : (
        <>
          {item}

          {exercise.type === 'bin' && (
            <View style={styles.grid}>
              {exercise.choices.map((c) =>
                tile(
                  c,
                  <View style={styles.center}>
                    <BinArt outcome={c.outcome!} size={short ? t.layout.art.sm : t.layout.art.md} />
                    <Text variant="bodyStrong" align="center">
                      {BIN[c.outcome!].short}
                    </Text>
                  </View>,
                  styles.half,
                ),
              )}
            </View>
          )}

          {exercise.type === 'code' && (
            <View style={styles.grid}>
              {exercise.choices.map((c) =>
                tile(
                  c,
                  <View style={styles.center}>
                    <Text variant="display">{c.label.split(' ')[0]}</Text>
                    <Text variant="callout" color="textSecondary" align="center">
                      {c.sublabel}
                    </Text>
                  </View>,
                  styles.half,
                ),
              )}
            </View>
          )}

          {exercise.type === 'stream' && (
            <View style={styles.list}>
              {exercise.choices.map((c) =>
                tile(
                  c,
                  <View style={styles.rowChoice}>
                    <Text variant="bodyStrong" style={styles.flex}>
                      {c.label}
                    </Text>
                    {c.sublabel && <Chip label={c.sublabel} size="sm" />}
                  </View>,
                ),
              )}
            </View>
          )}

          {exercise.type === 'parts' && (
            <View style={styles.list}>
              {exercise.choices.map((c) => {
                const on = selected.includes(c.id);
                return tile(
                  c,
                  <View style={styles.rowChoice}>
                    <Icon icon={on ? SquareCheck : Square} hue={on ? 'blue' : undefined} color="textTertiary" />
                    <View style={styles.flex}>
                      <Text variant="bodyStrong">{c.label}</Text>
                      {c.sublabel && (
                        <Text variant="caption" color="textSecondary">
                          {c.sublabel}
                        </Text>
                      )}
                    </View>
                    {checked !== null && c.outcome && <BinArt outcome={c.outcome} size={t.layout.icon.lg} />}
                  </View>,
                );
              })}
              <Text variant="caption" color="textTertiary">
                Select all that apply
              </Text>
            </View>
          )}

          {exercise.type === 'pick' && (
            <View style={styles.list}>
              {exercise.choices.map((c) =>
                tile(
                  c,
                  <View style={styles.rowChoice}>
                    <ItemArt objectId={c.objectId!} size="sm" />
                    <Text variant="bodyStrong" style={styles.flex}>
                      {c.label}
                    </Text>
                  </View>,
                ),
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { gap: t.space[4] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] },
  half: { flexBasis: '46%', flexGrow: 1 },
  list: { gap: t.space[3] },
  center: { alignItems: 'center', justifyContent: 'center', gap: t.space[2], minHeight: t.space[20] },
  rowChoice: { flexDirection: 'row', alignItems: 'center', gap: t.space[3], minHeight: t.space[8] },
  flex: { flex: 1 },
  fill: { flexGrow: 1 },
}));

