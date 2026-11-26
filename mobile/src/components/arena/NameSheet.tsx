import { useQueryClient } from '@tanstack/react-query';
import { Dices } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Appear, Button, Card, Text } from '@/components/ui';
import { paintOf } from '@/lib/cosmetics';
import { haptics } from '@/lib/haptics';
import { ArenaError, arenaKeys, deleteMe, rollName, savePlayer, type Player } from '@/lib/leaderboard';
import { useSettings } from '@/stores/settings';
import { useProgress } from '@/stores/progress';
import { easing, keyframes, makeStyles, useTheme } from '@/theme';
import { Avatar } from './Avatar';

/**
 * Roll (or re-roll) the name you show on the global leaderboard. Names are three random family-friendly words, like
 * "Happy Mossy Otter": nobody types one, so nothing unkind or personal can reach the board. It rises over a dimmed
 * screen. Keeping a name is what signs this device in (anonymously): nothing is posted until you have one, and
 * "Not now" plays against Tin offline.
 */
export function NameSheet({
  current,
  onDone,
  onCancel,
  cancelLabel = 'Not now',
}: {
  current?: string | null;
  onDone: (player: Player) => void;
  onCancel: () => void;
  cancelLabel?: string;
}) {
  const t = useTheme();
  const styles = useStyles();
  const queryClient = useQueryClient();
  const paint = paintOf(useProgress((s) => s.equipped)) ?? 'green';
  const [name, setName] = useState(() => rollName());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<'ask' | 'busy' | null>(null);

  // Two taps, the second on a red button that says exactly what goes: it cannot be undone.
  const remove = async () => {
    if (removing !== 'ask') {
      haptics.medium();
      setRemoving('ask');
      return;
    }
    setRemoving('busy');
    setError(null);
    try {
      await deleteMe();
      queryClient.setQueryData(arenaKeys.me, null);
      queryClient.removeQueries({ queryKey: ['arena'], exact: false });
      useSettings.setState({ recentPins: [] });
      haptics.success();
      onCancel();
    } catch (e) {
      haptics.error();
      setRemoving(null);
      setError(e instanceof ArenaError ? e.message : 'Could not remove you right now. Try again.');
    }
  };

  const reroll = () => {
    if (saving) return;
    haptics.selection();
    setName((previous) => {
      // Never land on the same name twice in a row.
      for (let i = 0; i < 5; i++) {
        const next = rollName();
        if (next !== previous) return next;
      }
      return rollName();
    });
    setError(null);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      let player: Player | null = null;
      let chosen = name;
      // With hundreds of millions of names a clash is rare; if someone has this one, quietly roll another.
      for (let attempt = 0; attempt < 5 && !player; attempt++) {
        try {
          player = await savePlayer(chosen, paint);
        } catch (e) {
          if (!(e instanceof ArenaError) || e.kind !== 'taken' || attempt === 4) throw e;
          chosen = rollName();
          setName(chosen);
        }
      }
      if (!player) return;
      queryClient.setQueryData(arenaKeys.me, player);
      void queryClient.invalidateQueries({ queryKey: ['arena', 'board'] });
      haptics.success();
      onDone(player);
    } catch (e) {
      haptics.error();
      setError(e instanceof ArenaError ? e.message : 'Could not save that name. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Animated.View
        style={[styles.scrim, { animationName: keyframes.fadeIn, animationDuration: t.motion.enter, animationTimingFunction: easing.out }]}
      />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Appear style={styles.sheetWrap}>
          <Card variant="floating" padding="lg" style={styles.sheet}>
            <View style={styles.head}>
              <Avatar name={name} paint={paint} size="lg" own />
              <View style={styles.flex}>
                <Text variant="title">{current ? 'Roll a new name' : 'Roll your name'}</Text>
                <Text variant="callout" color="textSecondary">
                  Three random words. Roll till you love it.
                </Text>
              </View>
            </View>
            <View style={styles.rolled} accessibilityLiveRegion="polite">
              <Text variant="display" align="center" accessibilityLabel={`Your name: ${name}`}>
                {name}
              </Text>
              {current && (
                <Text variant="callout" color="textSecondary" align="center">
                  {`Now: ${current}`}
                </Text>
              )}
              {error && (
                <Text variant="callout" hue="red" align="center">
                  {error}
                </Text>
              )}
            </View>
            <View style={styles.buttons}>
              <Button label={saving ? 'Saving…' : 'Use this name'} fullWidth disabled={saving} onPress={save} />
              <Button label="Roll again" icon={Dices} variant="secondary" fullWidth disabled={saving} onPress={reroll} />
              <Button label={cancelLabel} variant="ghost" hue="slate" fullWidth onPress={onCancel} />
            </View>
            {current && (
              <View style={styles.remove}>
                {removing === 'ask' && (
                  <Text variant="callout" hue="red" align="center">
                    This erases your name and matches for good. Your progress here stays.
                  </Text>
                )}
                <Button
                  label={removing === 'busy' ? 'Removing…' : removing === 'ask' ? 'Yes, remove me for good' : 'Remove me from the leaderboard'}
                  variant={removing === 'ask' ? 'danger' : 'ghost'}
                  hue="red"
                  size="md"
                  fullWidth
                  disabled={removing === 'busy'}
                  onPress={remove}
                />
              </View>
            )}
          </Card>
        </Appear>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.colors.scrim },
  fill: { flex: 1 },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', padding: t.layout.gutter },
  sheet: { gap: t.space[4], width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center', marginBottom: t.space[4] },
  head: { flexDirection: 'row', alignItems: 'center', gap: t.space[4] },
  flex: { flex: 1 },
  rolled: { gap: t.space[2], alignItems: 'center', paddingVertical: t.space[2] },
  buttons: { gap: t.space[2] },
  remove: { gap: t.space[2], borderTopWidth: t.layout.border, borderTopColor: t.colors.border, paddingTop: t.space[3] },
}));
