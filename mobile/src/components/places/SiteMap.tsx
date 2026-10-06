import MapView, { Marker } from 'react-native-maps';
import { View } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import { boundsOf, type SiteMapProps } from './SiteMap.types';

/** Native map: every nearby site as a marker; tapping one selects it in the list. */
export function SiteMap({ center, sites, selectedId, onSelect }: SiteMapProps) {
  const t = useTheme();
  const styles = useStyles();
  const b = boundsOf(center, sites, selectedId);
  return (
    <View style={styles.frame}>
      <MapView
        style={styles.map}
        region={{
          latitude: (b.minLat + b.maxLat) / 2,
          longitude: (b.minLon + b.maxLon) / 2,
          latitudeDelta: b.maxLat - b.minLat,
          longitudeDelta: b.maxLon - b.minLon,
        }}
        showsUserLocation
      >
        {sites.slice(0, 15).map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.lat, longitude: s.lon }}
            title={s.name}
            description={s.type}
            pinColor={s.id === selectedId ? t.colors.hue.green.base : s.confirmed ? t.colors.hue.blue.base : t.colors.hue.orange.base}
            onPress={() => onSelect(s.id)}
          />
        ))}
      </MapView>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  frame: {
    height: t.space[20] * 3,
    borderRadius: t.radius.lg,
    borderWidth: t.layout.border,
    borderColor: t.colors.border,
    overflow: 'hidden',
  },
  map: { flex: 1 },
}));
