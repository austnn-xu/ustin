import './urlPolyfill';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import type { HueName } from '@/theme';
import { leagues, names, numbers } from './engine';
import { secureStorage } from './secureStorage';

/**
 * The Arena's online half: the global leaderboard, rivals to race and game PINs, on Supabase.
 *
 * The database lives in `../supabase/migrations`. Players sign in anonymously (no email, no password): the first time
 * someone picks a leaderboard name, the device gets an anonymous account that keeps the name and their matches.
 * Every call goes through a database function that re-checks what it is given; nothing here writes a table directly.
 *
 * The URL and the public (anon) key come from EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY at build time.
 * Without them the Arena still works offline against Tin, and says plainly that the leaderboard is not connected.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const leaderboardConfigured = SUPABASE_URL.length > 0 && KEY.length > 0;

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!leaderboardConfigured) throw new ArenaError('offline', 'The leaderboard is not connected.');
  if (!client) {
    client = createClient(SUPABASE_URL, KEY, {
      // The session is the one secret the app holds: Keychain / Keystore on phones, never plain AsyncStorage.
      auth: { storage: secureStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
    // Native apps refresh the session only while in the foreground (Supabase's recommended setup).
    if (Platform.OS !== 'web') {
      const auth = client.auth;
      AppState.addEventListener('change', (state) => (state === 'active' ? auth.startAutoRefresh() : auth.stopAutoRefresh()));
    }
  }
  return client;
}

// ---------------------------------------------------------------------------
// Errors: one friendly sentence each, shown inline (never a system alert)
// ---------------------------------------------------------------------------

export type ArenaErrorKind = 'offline' | 'taken' | 'invalid' | 'ended' | 'played' | 'slow' | 'unknown';

export class ArenaError extends Error {
  constructor(
    public kind: ArenaErrorKind,
    message: string,
  ) {
    super(message);
  }
}

function toArenaError(error: { code?: string; message?: string } | null | undefined): ArenaError {
  const code = error?.code ?? '';
  const message = error?.message ?? '';
  if (code === '23505' && /name/i.test(message)) return new ArenaError('taken', 'Someone already has that name. Try another.');
  if (code === '23505') return new ArenaError('played', 'You already played this game.');
  if (code === '23514' && /reserved/i.test(message)) return new ArenaError('invalid', 'That name is reserved. Try another.');
  if (code === '22023' || code === '23514') return new ArenaError('invalid', 'That name did not work. Roll another.');
  if (code === 'P0002' && /PIN/i.test(message)) return new ArenaError('ended', 'That game PIN has ended or does not exist.');
  if (code === '53400') return new ArenaError('slow', message || 'Slow down a little and try again.');
  if (!code || /fetch|network|timed? ?out/i.test(message)) {
    return new ArenaError('offline', 'Could not reach the leaderboard. Check your connection.');
  }
  return new ArenaError('unknown', message || 'Something went wrong.');
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  let result;
  try {
    result = await db().rpc(fn, args);
  } catch (e) {
    throw e instanceof ArenaError ? e : toArenaError({ message: String(e) });
  }
  if (result.error) throw toArenaError(result.error);
  return result.data as T;
}

/** Sign in anonymously the first time this device plays online. */
async function ensureSession() {
  const auth = db().auth;
  const { data } = await auth.getSession();
  if (data.session) return;
  const { error } = await auth.signInAnonymously();
  if (error) throw toArenaError({ code: error.code, message: error.message });
}

async function hasSession() {
  if (!leaderboardConfigured) return false;
  const { data } = await db().auth.getSession();
  return !!data.session;
}

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

/** A new name: three words, one from each list, e.g. "Happy Mossy Otter". Players roll one; they never type it. */
export const rollName = (): string => names.roll();

export type Player = { name: string; paint: HueName };

/** The signed-in player, or null if this device has not picked a name yet. */
export async function fetchMe(): Promise<Player | null> {
  if (!(await hasSession())) return null;
  const rows = await rpc<Player[]>('me');
  return rows[0] ?? null;
}

/**
 * Remove this device's player from the leaderboard for good: the name, every match, every game PIN they hosted and the
 * anonymous account itself, on the server; then the session on this device. Nothing about them is left to sign back
 * into.
 */
export async function deleteMe(): Promise<void> {
  if (!(await hasSession())) return;
  await rpc<boolean>('delete_me');
  await db().auth.signOut({ scope: 'local' });
}

export async function savePlayer(name: string, paint: HueName): Promise<Player> {
  await ensureSession();
  const rows = await rpc<Player[]>('set_player', { p_name: name, p_paint: paint });
  return rows[0]!;
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

export type Opponent = {
  runId: string;
  seed: string;
  points: number[];
  score: number;
  name: string;
  paint: HueName;
  league: number;
  rr: number;
  playedAt: string;
};

/** A recent run by someone else to race: same seed, same questions. Null when nobody else has played yet. */
export async function findOpponent(): Promise<Opponent | null> {
  await ensureSession();
  const rows = await rpc<
    { run_id: string; seed: string; points: number[]; score: number; name: string; paint: HueName; league: number; rr: number; played_at: string }[]
  >('find_opponent');
  const r = rows[0];
  return r
    ? {
        runId: r.run_id,
        seed: r.seed,
        points: r.points,
        score: r.score,
        name: r.name,
        paint: r.paint,
        league: okLeague(r.league),
        rr: Number(r.rr) || 0,
        playedAt: r.played_at,
      }
    : null;
}

export type SubmittedRun = {
  runId: string;
  outcome: 'win' | 'loss' | 'tie' | 'solo';
  score: number;
  earned: number;
  rivalScore: number | null;
  /** The league after this match (Pristine can drop to Ruby on a loss). */
  league: number;
  /** Pristine only: rating after the match, and how much this match moved it. */
  rr: number;
  rrChange: number;
  /** Bronze–Ruby: this week's league points so far. */
  leaguePoints: number;
};

export async function submitRun(input: {
  seed: string;
  points: number[];
  rivalRun?: string | null;
  room?: string | null;
  tinScore?: number | null;
}): Promise<SubmittedRun> {
  await ensureSession();
  const rows = await rpc<
    {
      run_id: string;
      outcome: SubmittedRun['outcome'];
      score: number;
      earned: number;
      rival_score: number | null;
      league: number;
      rr: number;
      rr_change: number;
      league_points: number;
    }[]
  >(
    'submit_run',
    {
      p_seed: input.seed,
      p_points: input.points,
      p_rival_run: input.rivalRun ?? null,
      p_room: input.room ?? null,
      p_tin_score: input.tinScore ?? null,
    },
  );
  const r = rows[0]!;
  return {
    runId: r.run_id,
    outcome: r.outcome,
    score: r.score,
    earned: r.earned,
    rivalScore: r.rival_score,
    league: okLeague(r.league),
    rr: Number(r.rr) || 0,
    rrChange: Number(r.rr_change) || 0,
    leaguePoints: numbers.clampPoints(Number(r.league_points)),
  };
}

// ---------------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------------

export type Period = 'week' | 'all';

export type BoardRow = { rank: number; name: string; paint: HueName; points: number; wins: number; matches: number; league: number; rr: number; isMe: boolean };

/** The global board shows the top 25 (and your own row wherever you are). */
export const BOARD_SIZE = 25;

export async function fetchLeaderboard(period: Period, limit = BOARD_SIZE): Promise<BoardRow[]> {
  const rows = await rpc<
    { rank: number; name: string; paint: HueName; points: number; wins: number; matches: number; league: number; rr: number; is_me: boolean }[]
  >('leaderboard', { p_period: period, p_limit: limit });
  return rows.map((r) => ({
    rank: Number(r.rank),
    name: r.name,
    paint: r.paint,
    points: numbers.clampPoints(Number(r.points)),
    wins: Number(r.wins),
    matches: Number(r.matches),
    league: okLeague(r.league),
    rr: Number(r.rr) || 0,
    isMe: !!r.is_me,
  }));
}

// ---------------------------------------------------------------------------
// Leagues
// ---------------------------------------------------------------------------

const okLeague = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= leagues.PRISTINE ? v : 0);

export type MyLeague = {
  league: number;
  rr: number;
  /** When this week's groups close. */
  endsAt: string;
  /** This week's group (Bronze–Ruby): null until the first match of the week. */
  rank: number | null;
  size: number | null;
  points: number;
  matches: number;
  /** Pristine: place on the ladder. */
  pristineRank: number | null;
  pristineSize: number | null;
};

/** Where the signed-in player stands. Null when they have no leaderboard name yet. */
export async function fetchMyLeague(): Promise<MyLeague | null> {
  if (!(await hasSession())) return null;
  const rows = await rpc<
    {
      league: number;
      rr: number;
      ends_at: string;
      rank: number | null;
      size: number | null;
      points: number;
      matches: number;
      pristine_rank: number | null;
      pristine_size: number | null;
    }[]
  >('my_league');
  const r = rows[0];
  if (!r) return null;
  const n = (v: unknown) => (v == null ? null : Number(v));
  return {
    league: okLeague(r.league),
    rr: Number(r.rr) || 0,
    endsAt: r.ends_at,
    rank: n(r.rank),
    size: n(r.size),
    points: numbers.clampPoints(Number(r.points)),
    matches: Number(r.matches) || 0,
    pristineRank: n(r.pristine_rank),
    pristineSize: n(r.pristine_size),
  };
}

export type GroupRow = { rank: number; name: string; paint: HueName; points: number; matches: number; isMe: boolean };

/** This week's group, best first. */
export async function fetchLeagueBoard(): Promise<GroupRow[]> {
  if (!(await hasSession())) return [];
  return rpc<unknown[]>('league_board') as Promise<GroupRow[]>;
}

export type LadderRow = { rank: number; name: string; paint: HueName; rr: number; isMe: boolean };

/** Pristine, by RR: the top 25 plus your own place. */
export async function fetchPristineBoard(limit = BOARD_SIZE): Promise<LadderRow[]> {
  return rpc<LadderRow[]>('pristine_board', { p_limit: limit });
}

export type Room = { code: string; seed: string; host: string; players: number };

export async function createRoom(): Promise<{ code: string; seed: string }> {
  await ensureSession();
  const rows = await rpc<{ code: string; seed: string }[]>('create_room');
  return rows[0]!;
}

export async function joinRoom(code: string): Promise<Room> {
  const rows = await rpc<{ code: string; seed: string; host: string; players: number }[]>('join_room', { p_code: code });
  const r = rows[0];
  if (!r) throw new ArenaError('ended', 'That game PIN has ended or does not exist.');
  return { code: r.code, seed: r.seed, host: r.host, players: Number(r.players) };
}

export type RoomRow = { rank: number; name: string; paint: HueName; score: number; correct: number; isMe: boolean };

export async function fetchRoomBoard(code: string): Promise<RoomRow[]> {
  const rows = await rpc<{ rank: number; name: string; paint: HueName; score: number; correct: number; is_me: boolean }[]>('room_board', {
    p_code: code,
  });
  return rows.map((r) => ({ rank: Number(r.rank), name: r.name, paint: r.paint, score: r.score, correct: r.correct, isMe: !!r.is_me }));
}

/** Six digits, shown as two groups of three so they are easy to read out. */
export const formatPin = (code: string) => `${code.slice(0, 3)} ${code.slice(3)}`;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const PAINTS: HueName[] = ['green', 'blue', 'red', 'orange', 'yellow', 'purple', 'brown', 'slate'];
const okName = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 32;
const okCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/**
 * Boards are cached on the device between launches (see queryCache.ts), so rows are checked before they are drawn:
 * a malformed one is dropped, an unknown paint becomes green.
 */
export function cleanBoard(rows: unknown): BoardRow[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r): r is BoardRow => !!r && typeof r === 'object' && okName(r.name) && okCount(r.rank) && okCount(r.points))
    .slice(0, 101)
    .map((r) => ({
      rank: r.rank,
      name: r.name,
      paint: PAINTS.includes(r.paint) ? r.paint : 'green',
      points: r.points,
      wins: okCount(r.wins) ? r.wins : 0,
      matches: okCount(r.matches) ? r.matches : 0,
      league: okLeague(r.league),
      rr: okCount(r.rr) ? r.rr : 0,
      isMe: r.isMe === true,
    }));
}

const rowBase = (r: Record<string, unknown>) => ({
  rank: Number(r.rank),
  name: String(r.name),
  paint: PAINTS.includes(r.paint as HueName) ? (r.paint as HueName) : 'green',
  isMe: r.isMe === true || r.is_me === true,
});
const isRow = (r: unknown): r is Record<string, unknown> =>
  !!r && typeof r === 'object' && okName((r as Record<string, unknown>).name) && okCount(Number((r as Record<string, unknown>).rank));

export function cleanGroup(rows: unknown): GroupRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter(isRow).slice(0, 60).map((r) => ({
    ...rowBase(r),
    points: numbers.clampPoints(Number(r.points)),
    matches: okCount(Number(r.matches)) ? Number(r.matches) : 0,
  }));
}

export function cleanLadder(rows: unknown): LadderRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter(isRow).slice(0, 101).map((r) => ({ ...rowBase(r), rr: okCount(Number(r.rr)) ? Number(r.rr) : 0 }));
}

export function cleanRoomBoard(rows: unknown): RoomRow[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r): r is RoomRow => !!r && typeof r === 'object' && okName(r.name) && okCount(r.rank) && okCount(r.score))
    .slice(0, 500)
    .map((r) => ({
      rank: r.rank,
      name: r.name,
      paint: PAINTS.includes(r.paint) ? r.paint : 'green',
      score: r.score,
      correct: okCount(r.correct) ? r.correct : 0,
      isMe: r.isMe === true,
    }));
}

export const arenaKeys = {
  me: ['arena', 'me'] as const,
  myLeague: ['arena', 'my-league'] as const,
  group: ['arena', 'group'] as const,
  ladder: ['arena', 'ladder'] as const,
  board: (period: Period) => ['arena', 'board', period] as const,
  room: (code: string) => ['arena', 'room', code] as const,
  roomBoard: (code: string) => ['arena', 'room-board', code] as const,
};

export function useMe() {
  return useQuery({ queryKey: arenaKeys.me, queryFn: fetchMe, enabled: leaderboardConfigured, staleTime: 10 * 60_000 });
}

export function useMyLeague() {
  return useQuery({ queryKey: arenaKeys.myLeague, queryFn: fetchMyLeague, enabled: leaderboardConfigured, staleTime: 30_000 });
}

export function useLeagueBoard(enabled = true) {
  return useQuery({
    queryKey: arenaKeys.group,
    queryFn: fetchLeagueBoard,
    // Straight from the database function (snake_case is_me included): checked like every board.
    select: (rows: unknown) => cleanGroup(rows),
    enabled: leaderboardConfigured && enabled,
    staleTime: 30_000,
  });
}

export function usePristineBoard(enabled = true) {
  return useQuery({
    queryKey: arenaKeys.ladder,
    queryFn: () => fetchPristineBoard(),
    select: (rows: unknown) => cleanLadder(rows),
    enabled: leaderboardConfigured && enabled,
    staleTime: 30_000,
  });
}

export function useLeaderboard(period: Period, limit = BOARD_SIZE) {
  return useQuery({
    queryKey: [...arenaKeys.board(period), limit],
    queryFn: () => fetchLeaderboard(period, limit),
    select: cleanBoard,
    enabled: leaderboardConfigured,
    staleTime: 30_000,
  });
}

export function useRoom(code: string | undefined) {
  return useQuery({
    queryKey: arenaKeys.room(code ?? ''),
    queryFn: () => joinRoom(code!),
    enabled: leaderboardConfigured && !!code,
    retry: (count, error) => !(error instanceof ArenaError && error.kind === 'ended') && count < 1,
  });
}

/** A game PIN's standings. `live` polls every few seconds, so the podium fills in as friends finish. */
export function useRoomBoard(code: string | undefined, live: boolean) {
  return useQuery({
    queryKey: arenaKeys.roomBoard(code ?? ''),
    queryFn: () => fetchRoomBoard(code!),
    select: cleanRoomBoard,
    enabled: leaderboardConfigured && !!code,
    staleTime: 0,
    refetchInterval: live ? 4000 : false,
  });
}
