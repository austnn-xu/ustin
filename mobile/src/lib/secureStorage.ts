import * as SecureStore from 'expo-secure-store';

/**
 * Where the leaderboard's sign-in session lives on iOS and Android: the Keychain / Keystore, encrypted by the OS and
 * never in plain app storage. Only this one secret goes here; progress and settings are not secrets and stay in
 * AsyncStorage.
 *
 * `THIS_DEVICE_ONLY` keeps the token out of iCloud / backups, so a restored backup on another phone cannot reuse it.
 * `AFTER_FIRST_UNLOCK` lets the token refresh while the app is in the background.
 *
 * SecureStore warns above ~2 KB per value and a Supabase session can be bigger, so a value is split into chunks:
 * `key` holds the chunk count and `key.0`, `key.1`, … the pieces.
 *
 * The web build has no such store (see secureStorage.web.ts).
 */
const OPTIONS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };
const CHUNK = 1800;
/** SecureStore keys may only use letters, digits, '.', '-' and '_'. */
const safe = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

async function removeChunks(key: string, from = 0) {
  const count = Number((await SecureStore.getItemAsync(key, OPTIONS)) ?? 0);
  for (let i = from; i < count; i += 1) await SecureStore.deleteItemAsync(`${key}.${i}`, OPTIONS);
}

export const secureStorage = {
  async getItem(name: string): Promise<string | null> {
    const key = safe(name);
    const count = Number((await SecureStore.getItemAsync(key, OPTIONS)) ?? NaN);
    if (!Number.isInteger(count) || count <= 0) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`, OPTIONS);
      // A missing piece means a half-written value: treat it as signed out rather than hand back a broken token.
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(name: string, value: string): Promise<void> {
    const key = safe(name);
    const pieces = Math.max(1, Math.ceil(value.length / CHUNK));
    for (let i = 0; i < pieces; i += 1) await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK), OPTIONS);
    await removeChunks(key, pieces);
    await SecureStore.setItemAsync(key, String(pieces), OPTIONS);
  },

  async removeItem(name: string): Promise<void> {
    const key = safe(name);
    await removeChunks(key);
    await SecureStore.deleteItemAsync(key, OPTIONS);
  },
};
