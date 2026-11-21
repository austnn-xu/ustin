import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, type Query } from '@tanstack/react-query';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

/**
 * The cache of fetched data, kept across launches, so the app opens with the last good answer instead of a blank
 * screen, works offline, and asks OpenStreetMap's free services (which have strict fair-use rules) less often.
 *
 * What may be kept is an allowlist, not "everything": public data only.
 *   - places    nearby drop-off sites from OpenStreetMap
 *   - boards    the global leaderboard and game PIN podiums (names and scores everyone can see anyway)
 * Never kept: the signed-in player (`arena/me`), game PIN lookups, errors, and anything not listed here. The sign-in
 * session is not in this cache at all; it lives in the OS keychain (see secureStorage.ts).
 *
 * The saved copy expires after a day, and `CACHE_VERSION` throws it away whenever the shape of cached data changes.
 * Reset progress clears it (see clearCache).
 */

/** Bump when the shape of any cached query's data changes; old copies are then discarded on launch. */
export const CACHE_VERSION = 'v1';
const MAX_AGE = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'ustin-query-cache';
/** A cache bigger than this is not saved: it would slow every launch to read back (and something is wrong). */
const MAX_BYTES = 1_500_000;

const KEEP: ((key: readonly unknown[]) => boolean)[] = [
  (k) => k[0] === 'places',
  (k) => k[0] === 'arena' && (k[1] === 'board' || k[1] === 'room-board'),
];

export const shouldKeep = (query: Pick<Query, 'queryKey' | 'state'>) =>
  query.state.status === 'success' && query.state.data !== undefined && KEEP.some((keep) => keep(query.queryKey));

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      // Kept in memory as long as on disk, or a restored entry would be dropped before anyone looks at it.
      gcTime: MAX_AGE,
      retry: 1,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: STORAGE_KEY,
  throttleTime: 2000,
  serialize: (client) => {
    const json = JSON.stringify(client);
    return json.length > MAX_BYTES ? JSON.stringify({ ...client, clientState: { queries: [], mutations: [] } }) : json;
  },
  // A damaged copy is no copy: start empty rather than fail to launch.
  deserialize: (raw) => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.clientState && Array.isArray(parsed.clientState.queries)) return parsed;
    } catch {
      // fall through
    }
    return { timestamp: 0, buster: 'invalid', clientState: { queries: [], mutations: [] } };
  },
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: MAX_AGE,
  buster: CACHE_VERSION,
  dehydrateOptions: { shouldDehydrateQuery: shouldKeep, shouldDehydrateMutation: () => false },
};

/** Forget every cached answer, in memory and on disk. */
export async function clearCache() {
  queryClient.clear();
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}
