import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { boundsOf, type SiteMapProps } from './SiteMap.types';

/**
 * On the web the map is OpenStreetMap's own embed: no API key, no tracking script, and the same data the list comes
 * from. It marks the selected (or nearest) site.
 */
export function SiteMap({ center, sites, selectedId }: SiteMapProps) {
  const styles = useStyles();
  const b = boundsOf(center, sites, selectedId);
  const marked = sites.find((s) => s.id === selectedId) ?? sites[0];
  const bbox = [b.minLon, b.minLat, b.maxLon, b.maxLat].map((v) => v.toFixed(5)).join(',');
  const marker = marked ? `&marker=${marked.lat.toFixed(5)},${marked.lon.toFixed(5)}` : '';
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`;
  return (
    <View style={styles.frame}>
      <iframe title="Map of nearby drop-off sites" src={src} style={{ border: 0, width: '100%', height: '100%' }} loading="lazy" />
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
    backgroundColor: t.colors.fill,
  },
}));
