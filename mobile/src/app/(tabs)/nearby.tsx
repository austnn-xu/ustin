import { useQuery } from '@tanstack/react-query';
import { useIsFocused, useLocalSearchParams } from 'expo-router';
import { ExternalLink } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { ItemArt } from '@/components/art/ItemArt';
import { MascotSays } from '@/components/MascotSays';
import { LocationPicker, LocationPill } from '@/components/places/LocationPicker';
import { SiteCard } from '@/components/places/SiteCard';
import { SiteMap } from '@/components/places/SiteMap';
import { Button, Card, Icon, PressableScale, Screen, Skeleton, SkeletonText, Text } from '@/components/ui';
import { rules } from '@/lib/engine';
import {
  earth911Url,
  findPlaces,
  KIND_ORDER,
  KINDS,
  mapsSearchUrl,
  OSM_ATTRIBUTION,
  usesMiles,
  type PlaceKind,
} from '@/lib/places';
import { useSettings } from '@/stores/settings';
import { makeStyles, useTheme } from '@/theme';

export default function Nearby() {
  const styles = useStyles();
  const params = useLocalSearchParams<{ kind?: string; item?: string }>();
  const place = useSettings((s) => s.place);
  const [kind, setKind] = useState<PlaceKind>('recycling');
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const item = params.item ? rules.findObject(params.item) : null;

  // Arriving from an item's verdict picks the kind of place that item needs.
  useEffect(() => {
    if (params.kind && params.kind in KINDS) setKind(params.kind as PlaceKind);
  }, [params.kind, params.item]);

  // The tab is built in the background before anyone opens it; only ask OpenStreetMap once it has actually been seen.
  const focused = useIsFocused();
  const [seen, setSeen] = useState(focused);
  if (focused && !seen) setSeen(true);

  const query = useQuery({
    queryKey: ['places', kind, place?.lat, place?.lon],
    queryFn: () => findPlaces(kind, place!.lat, place!.lon),
    enabled: !!place && seen,
  });

  useEffect(() => setSelected(null), [kind, place?.lat, place?.lon]);

  const miles = usesMiles(place?.zip);
  const info = KINDS[kind];

  return (
    <Screen gutter={false} keyboard>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          <Text variant="display">Near me</Text>

          {item && (
            <Card variant="tinted" hue={info.hue} style={styles.itemBanner}>
              <ItemArt objectId={item.id} size="sm" />
              <View style={styles.flex}>
                <Text variant="label" hue={info.hue}>
                  Finding a spot for
                </Text>
                <Text variant="bodyStrong">{item.label}</Text>
              </View>
            </Card>
          )}

          {!place || editing ? (
            <Card padding="lg" style={styles.gap}>
              {!place && (
                <MascotSays mood="thinking" size="sm">
                  Where should I look? Give me a ZIP code, or let me use your location.
                </MascotSays>
              )}
              <LocationPicker onDone={() => setEditing(false)} />
              {place && <Button label="Cancel" variant="ghost" fullWidth onPress={() => setEditing(false)} />}
            </Card>
          ) : (
            <LocationPill onPress={() => setEditing(true)} />
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kinds}>
          {KIND_ORDER.map((k) => (
            <KindChip key={k} kind={k} active={k === kind} onPress={() => setKind(k)} />
          ))}
        </ScrollView>

        {place && !editing && (
          <View style={styles.column}>
            {query.isPending ? (
              <Loading />
            ) : query.isError ? (
              <Card padding="lg" style={styles.gap}>
                <MascotSays mood="sad" size="sm">
                  I could not reach the map service. It might be busy. Try again in a moment.
                </MascotSays>
                <Button label="Try again" variant="secondary" fullWidth onPress={() => query.refetch()} />
              </Card>
            ) : query.data.sites.length === 0 ? (
              <Card padding="lg" style={styles.gap}>
                <MascotSays mood="worried" size="sm">
                  {`I could not find a mapped ${info.label.toLowerCase()} spot within ${Math.round(
                    miles ? query.data.radiusKm * 0.621 : query.data.radiusKm,
                  )} ${miles ? 'miles' : 'km'}. These searches know more places:`}
                </MascotSays>
                <LinksOut kind={kind} />
              </Card>
            ) : (
              <>
                <SiteMap center={query.data.at} sites={query.data.sites} selectedId={selected} onSelect={setSelected} />
                <Text variant="label" color="textSecondary">
                  {`${query.data.sites.length} ${query.data.sites.length === 1 ? 'place' : 'places'} for ${info.label.toLowerCase()}, nearest first`}
                </Text>
                {query.data.sites.map((s) => (
                  <SiteCard key={s.id} site={s} miles={miles} selected={s.id === selected} onPress={() => setSelected(s.id)} />
                ))}
                <Card style={styles.gap}>
                  <Text variant="bodyStrong">Not finding the right place?</Text>
                  <LinksOut kind={kind} />
                </Card>
              </>
            )}
            <Text variant="caption" color="textTertiary" align="center">
              {OSM_ATTRIBUTION}
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function KindChip({ kind, active, onPress }: { kind: PlaceKind; active: boolean; onPress: () => void }) {
  const t = useTheme();
  const styles = useStyles();
  const info = KINDS[kind];
  const hue = t.colors.hue[info.hue];
  return (
    <PressableScale
      haptic="selection"
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={info.label}
      style={[styles.chip, active && { borderColor: hue.base, backgroundColor: hue.subtle }]}
    >
      <Icon icon={info.icon} size="sm" hue={active ? info.hue : undefined} color="textSecondary" />
      <Text variant="callout" hue={active ? info.hue : undefined} color="textSecondary">
        {info.label}
      </Text>
    </PressableScale>
  );
}

function LinksOut({ kind }: { kind: PlaceKind }) {
  const styles = useStyles();
  const place = useSettings((s) => s.place)!;
  return (
    <View style={styles.links}>
      <Button label="Search Earth911" icon={ExternalLink} variant="neutral" size="md" fullWidth onPress={() => Linking.openURL(earth911Url(kind, place))} />
      <Button label="Search Google Maps" icon={ExternalLink} variant="neutral" size="md" fullWidth onPress={() => Linking.openURL(mapsSearchUrl(kind, place))} />
    </View>
  );
}

function Loading() {
  const t = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.gap}>
      <MascotSays mood="thinking" size="sm">
        Checking the map for places near you…
      </MascotSays>
      <Skeleton height={t.space[20] * 3} radius="lg" />
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <Skeleton width="60%" height={t.space[5]} />
          <SkeletonText lines={2} variant="caption" />
          <Skeleton width={t.space[20] * 1.5} height={t.layout.control.md} radius="lg" />
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  content: { paddingTop: t.space[4], paddingBottom: t.space[16], gap: t.space[4] },
  column: { width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center', paddingHorizontal: t.layout.gutter, gap: t.space[4] },
  flex: { flex: 1 },
  gap: { gap: t.space[4] },
  itemBanner: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  kinds: { gap: t.space[2], paddingHorizontal: t.layout.gutter },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[1.5],
    minHeight: t.layout.control.sm + t.space[1],
    paddingHorizontal: t.space[3],
    borderRadius: t.radius.pill,
    borderWidth: t.layout.border,
    borderColor: t.colors.border,
  },
  links: { gap: t.space[2] },
  skeletonCard: {
    gap: t.space[3],
    padding: t.space[4],
    borderRadius: t.radius.lg,
    borderWidth: t.layout.border,
    borderColor: t.colors.border,
  },
}));
