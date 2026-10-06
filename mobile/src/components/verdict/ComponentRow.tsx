import { View } from 'react-native';
import { BIN, BinArt } from '@/components/art/Bin';
import { Chip, Text } from '@/components/ui';
import type { ResolvedComponent } from '@/lib/engine';
import { makeStyles, useTheme } from '@/theme';

const ACCEPTANCE_HUE = { widely: 'green', varies: 'orange', rarely: 'red' } as const;

/** One part of an item: which bin, which material stream, how widely accepted, and why. */
export function ComponentRow({ component, showPart }: { component: ResolvedComponent; showPart: boolean }) {
  const t = useTheme();
  const styles = useStyles();
  const bin = BIN[component.outcome.id];
  return (
    <View style={styles.row}>
      <BinArt outcome={component.outcome.id} size={t.layout.art.md} />
      <View style={styles.body}>
        {showPart && <Text variant="heading">{component.label}</Text>}
        <Text variant={showPart ? 'bodyStrong' : 'heading'} hue={bin.hue}>
          {component.outcome.label}
        </Text>
        <Text variant="caption" color="textTertiary">
          {component.material}
        </Text>
        {component.stream && (
          <View style={styles.chips}>
            <Chip label={`${component.stream.code} · ${component.stream.label}`} size="sm" />
            <Chip label={component.stream.acceptance.label} size="sm" hue={ACCEPTANCE_HUE[component.stream.acceptance.id]} />
          </View>
        )}
        <Text variant="body" color="textSecondary">
          {component.why}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', gap: t.space[4], alignItems: 'flex-start' },
  body: { flex: 1, gap: t.space[1] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[1.5], marginVertical: t.space[1] },
}));
