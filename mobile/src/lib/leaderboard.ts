import './urlPolyfill';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import type { HueName } from '@/theme';
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
  if (code === '23514') return new ArenaError('invalid', 'Names are 2 to 16 letters, numbers, spaces, dots, dashes or underscores.');
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

export const NAME = { min: 2, max: 16, shape: /^[A-Za-z0-9][A-Za-z0-9 _.-]*$/ } as const;

/** Tidy a name the way the server will (trim, single spaces) and say what is wrong with it, if anything. */
export function checkName(raw: string): { name: string; problem: string | null } {
  const name = raw.replace(/\s+/g, ' ').trim();
  if (name.length < NAME.min) return { name, problem: `At least ${NAME.min} characters` };
  if (name.length > NAME.max) return { name, problem: `At most ${NAME.max} characters` };
  if (!NAME.shape.test(name)) return { name, problem: 'Letters, numbers, spaces, dots, dashes or underscores' };
  return { name, problem: null };
}

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

export type Opponent = { runId: string; seed: string; points: number[]; score: number; name: string; paint: HueName; playedAt: string };

/** A recent run by someone else to race: same seed, same questions. Null when nobody else has played yet. */
export async function findOpponent(): Promise<Opponent | null> {
  await ensureSession();
  const rows = await rpc<
    { run_id: string; seed: string; points: number[]; score: number; name: string; paint: HueName; played_at: string }[]
  >('find_opponent');
  const r = rows[0];
  return r ? { runId: r.run_id, seed: r.seed, points: r.points, score: r.score, name: r.name, paint: r.paint, playedAt: r.played_at } : null;
}

export type SubmittedRun = { runId: string; outcome: 'win' | 'loss' | 'tie' | 'solo'; score: number; earned: number; rivalScore: number | null };

export async function submitRun(input: {
  seed: string;
  points: number[];
  rivalRun?: string | null;
  room?: string | null;
  tinScore?: number | null;
}): Promise<SubmittedRun> {
  await ensureSession();
  const rows = await rpc<{ run_id: string; outcome: SubmittedRun['outcome']; score: number; earned: number; rival_score: number | null }[]>(
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
  return { runId: r.run_id, outcome: r.outcome, score: r.score, earned: r.earned, rivalScore: r.rival_score };
}

// ---------------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------------

export type Period = 'week' | 'all';

export type BoardRow = { rank: number; name: string; paint: HueName; points: number; wins: number; matches: number; isMe: boolean };

export async function fetchLeaderboard(period: Period, limit = 50): Promise<BoardRow[]> {
  const rows = await rpc<
    { rank: number; name: string; paint: HueName; points: number; wins: number; matches: number; is_me: boolean }[]
  >('leaderboard', { p_period: period, p_limit: limit });
  return rows.map((r) => ({
    rank: Number(r.rank),
    name: r.name,
    paint: r.paint,
    points: Number(r.points),
    wins: Number(r.wins),
    matches: Number(r.matches),
    isMe: !!r.is_me,
  }));
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
      isMe: r.isMe === true,
    }));
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
  board: (period: Period) => ['arena', 'board', period] as const,
  room: (code: string) => ['arena', 'room', code] as const,
  roomBoard: (code: string) => ['arena', 'room-board', code] as const,
};

export function useMe() {
  return useQuery({ queryKey: arenaKeys.me, queryFn: fetchMe, enabled: leaderboardConfigured, staleTime: 10 * 60_000 });
}

export function useLeaderboard(period: Period, limit = 50) {
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
