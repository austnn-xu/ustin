/**
 * The web build's home for the leaderboard session. Browsers offer a page no encrypted, script-proof store (that would
 * need an httpOnly cookie from a server, and the site is static), so it is localStorage, scoped to this site's origin.
 * What protects it is keeping other people's scripts off the page: the Content-Security-Policy added at publish time
 * (scripts/harden-web.mjs) allows scripts from this site only.
 *
 * The session is an anonymous leaderboard identity, nothing more: no email, no password, no payment details. The worst
 * a stolen one allows is posting matches under that name, and "Remove me from the leaderboard" ends it.
 *
 * Every access is guarded: storage can be disabled (private windows, blocked site data), and then the app simply acts
 * signed out.
 */
export const secureStorage = {
  async getItem(name: string): Promise<string | null> {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  async setItem(name: string, value: string): Promise<void> {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Storage is off: the session lasts as long as the tab.
    }
  },
  async removeItem(name: string): Promise<void> {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Nothing stored, nothing to remove.
    }
  },
};
