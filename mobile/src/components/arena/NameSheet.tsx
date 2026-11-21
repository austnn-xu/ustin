import { useQueryClient } from '@tanstack/react-query';
import { AtSign } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Appear, Button, Card, Input, Text } from '@/components/ui';
import { paintOf } from '@/lib/cosmetics';
import { haptics } from '@/lib/haptics';
import { ArenaError, arenaKeys, checkName, NAME, savePlayer, type Player } from '@/lib/leaderboard';
import { useProgress } from '@/stores/progress';
import { easing, keyframes, makeStyles, useTheme } from '@/theme';
import { Avatar } from './Avatar';

/**
 * Pick (or change) the name you show on the global leaderboard. It rises over a dimmed screen. Choosing a name is what
 * signs this device in (anonymously): nothing is posted until you have one, and "Not now" plays against Tin offline.
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
  const [value, setValue] = useState(current ?? '');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { name, problem } = checkName(value);

  const save = async () => {
    setTouched(true);
    if (problem || saving) return;
    setSaving(true);
    setError(null);
    try {
      const player = await savePlayer(name, paint);
      queryClient.setQueryData(arenaKeys.me, player);
      void queryClient.invalidateQueries({ queryKey: ['arena', 'board'] });
      haptics.success();
      onDone(player);
    } catch (e) {
      haptics.error();
      setError(e instanceof ArenaError ? e.message : 'Could not save that name.');
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
              <Avatar name={name || '?'} paint={paint} size="lg" />
              <View style={styles.flex}>
                <Text variant="title">{current ? 'Change your name' : 'Your leaderboard name'}</Text>
                <Text variant="callout" color="textSecondary">
                  Everyone sees it on the global leaderboard, so skip your full name. Your avatar is Tin&apos;s paint colour.
                </Text>
              </View>
            </View>
            <Input
              value={value}
              onChangeText={(v) => {
                setValue(v);
                setError(null);
              }}
              placeholder="e.g. BinBoss"
              icon={AtSign}
              maxLength={NAME.max + 4}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={save}
              accessibilityLabel="Leaderboard name"
              error={error ?? (touched && problem ? problem : undefined)}
              hint={`${NAME.min} to ${NAME.max} characters`}
            />
            <View style={styles.buttons}>
              <Button label={saving ? 'Saving…' : 'Save name'} fullWidth disabled={saving || (touched && !!problem)} onPress={save} />
              <Button label={cancelLabel} variant="ghost" hue="slate" fullWidth onPress={onCancel} />
            </View>
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
  buttons: { gap: t.space[2] },
}));
