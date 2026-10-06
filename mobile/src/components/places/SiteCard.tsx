import { CircleCheck, Clock, ExternalLink, Info, Navigation, Phone } from 'lucide-react-native';
import { Linking, View } from 'react-native';
import { Button, Chip, Icon, PressableScale, Text } from '@/components/ui';
import { directionsUrl, formatDistance, type Site } from '@/lib/places';
import { makeStyles, useTheme } from '@/theme';

/** One nearby place: what it is, how far, whether it is confirmed to take the item, and how to get there. */
export function SiteCard({ site, miles, selected, onPress }: { site: Site; miles: boolean; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.card, selected && { borderColor: t.colors.hue.blue.base, backgroundColor: t.colors.hue.blue.subtle }]}>
      {/* Tapping the details shows the site on the map; the action buttons sit outside so buttons never nest. */}
      <PressableScale
        scale={false}
        haptic="selection"
        onPress={onPress}
        accessibilityLabel={`${site.name}, ${site.type}, ${formatDistance(site.distanceKm, miles)} away. Show on map`}
        style={styles.details}
      >
        <View style={styles.top}>
          <View style={styles.flex}>
            <Text variant="heading" numberOfLines={2}>
              {site.name}
            </Text>
            <Text variant="callout" color="textSecondary">
              {[site.name === site.type ? null : site.type, site.address].filter(Boolean).join(' · ') || 'No street address on the map'}
            </Text>
          </View>
          <Text variant="bodyStrong" hue="blue" tabular>
            {formatDistance(site.distanceKm, miles)}
          </Text>
        </View>

        {site.confirmed ? (
          <View style={styles.status}>
            <Icon icon={CircleCheck} size="sm" hue="green" shade="text" />
            <Text variant="callout" hue="green">
              Listed as accepting this
            </Text>
          </View>
        ) : (
          <View style={styles.status}>
            <Icon icon={Info} size="sm" hue="orange" shade="text" />
            <Text variant="callout" hue="orange" style={styles.flex}>
              {site.note}
            </Text>
          </View>
        )}

        {site.accepts.length > 0 && (
          <View style={styles.chips}>
            {site.accepts.slice(0, 5).map((a) => (
              <Chip key={a} label={a} size="sm" />
            ))}
            {site.accepts.length > 5 && <Chip label={`+${site.accepts.length - 5}`} size="sm" />}
          </View>
        )}

        {site.hours && (
          <View style={styles.status}>
            <Icon icon={Clock} size="sm" color="textTertiary" />
            <Text variant="caption" color="textSecondary" numberOfLines={2} style={styles.flex}>
              {site.hours}
            </Text>
          </View>
        )}

      </PressableScale>

      <View style={styles.actions}>
        <Button label="Directions" icon={Navigation} variant="secondary" size="md" onPress={() => Linking.openURL(directionsUrl(site))} />
        {site.phone && (
          <Button label="Call" icon={Phone} variant="neutral" size="md" onPress={() => Linking.openURL(`tel:${site.phone!.replace(/[^\d+]/g, '')}`)} />
        )}
        {site.website && (
          <Button label="Website" icon={ExternalLink} variant="neutral" size="md" onPress={() => Linking.openURL(site.website!)} />
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    gap: t.space[3],
    padding: t.space[4],
    borderRadius: t.radius.lg,
    borderWidth: t.layout.border,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  details: { gap: t.space[3] },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3] },
  flex: { flex: 1 },
  status: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[1.5] },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] },
}));
