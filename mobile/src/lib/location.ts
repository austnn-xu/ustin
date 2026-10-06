import * as Location from 'expo-location';
import { useState } from 'react';
import { useSettings, type SavedPlace } from '@/stores/settings';
import { geocode, LookupError, reverseGeocode } from './places';

/**
 * Set the place "Near me" searches around: from a ZIP code / town, or from the device's location.
 * Errors come back as readable sentences for inline display.
 */
export function useLocate() {
  const setPlace = useSettings((s) => s.setPlace);
  const [busy, setBusy] = useState<'zip' | 'gps' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = (place: SavedPlace) => {
    setPlace(place);
    setError(null);
    return place;
  };

  const byQuery = async (query: string) => {
    setBusy('zip');
    setError(null);
    try {
      const p = await geocode(query);
      return save({ label: p.label, lat: p.lat, lon: p.lon, zip: p.zip, source: 'zip' });
    } catch (err) {
      setError(err instanceof LookupError ? err.message : 'Could not look that up. Try again in a moment.');
      return null;
    } finally {
      setBusy(null);
    }
  };

  const byGps = async () => {
    setBusy('gps');
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Location is off for US Tin. Enter a ZIP code instead, or allow location in your settings.');
        return null;
      }
      const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lon } = fix.coords;
      const named = await reverseGeocode(lat, lon);
      return save({ label: named.label, lat, lon, zip: named.zip, source: 'gps' });
    } catch {
      setError('Could not get your location. Enter a ZIP code instead.');
      return null;
    } finally {
      setBusy(null);
    }
  };

  return { byQuery, byGps, busy, error, clearError: () => setError(null) };
}
