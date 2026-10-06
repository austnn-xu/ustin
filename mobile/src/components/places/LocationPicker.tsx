import { LocateFixed, MapPin, Search } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Icon, Input, PressableScale, Text } from '@/components/ui';
import { useLocate } from '@/lib/location';
import { useSettings } from '@/stores/settings';
import { makeStyles } from '@/theme';

/** Where "near me" is: a ZIP code or town, or the device's location. */
export function LocationPicker({ onDone }: { onDone?: () => void }) {
  const styles = useStyles();
  const place = useSettings((s) => s.place);
  const [query, setQuery] = useState(place?.zip ?? '');
  const { byQuery, byGps, busy, error } = useLocate();

  const submit = async () => {
    if (await byQuery(query)) onDone?.();
  };

  return (
    <View style={styles.root}>
      <Input
        label="ZIP code or town"
        value={query}
        onChangeText={setQuery}
        placeholder="e.g. 94110"
        icon={Search}
        keyboardType="default"
        autoComplete="postal-code"
        returnKeyType="search"
        onSubmitEditing={submit}
        clearable
        error={error ?? undefined}
      />
      <Button
        label={busy === 'zip' ? 'Looking…' : 'Search here'}
        variant="secondary"
        fullWidth
        disabled={!query.trim() || busy !== null}
        onPress={submit}
      />
      <Button
        label={busy === 'gps' ? 'Locating…' : 'Use my location'}
        icon={LocateFixed}
        variant="neutral"
        fullWidth
        disabled={busy !== null}
        onPress={async () => {
          if (await byGps()) onDone?.();
        }}
      />
    </View>
  );
}

/** The current place as a pill, tap to change. */
export function LocationPill({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  const place = useSettings((s) => s.place);
  return (
    <PressableScale onPress={onPress} haptic="selection" accessibilityLabel={`Searching near ${place?.label ?? 'nowhere yet'}. Change location`} style={styles.pill}>
      <Icon icon={MapPin} size="sm" hue="blue" />
      <Text variant="callout" numberOfLines={1} style={styles.pillText}>
        {place?.label ?? 'Set your location'}
      </Text>
      <Text variant="label" hue="blue">
        Change
      </Text>
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  root: { gap: t.space[3] },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[2],
    alignSelf: 'stretch',
    minHeight: t.layout.control.md,
    paddingHorizontal: t.space[4],
    borderRadius: t.radius.lg,
    borderWidth: t.layout.border,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgSubtle,
  },
  pillText: { flex: 1 },
}));
