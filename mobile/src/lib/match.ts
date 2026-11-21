import type { Player } from './leaderboard';
import type { HueName } from '@/theme';

/** Who a match is against. A player's run and Tin come with every answer's points; a game PIN's players do not. */
export type Rival =
  | { kind: 'player'; runId: string; name: string; paint: HueName; points: number[]; playedAt: string; league: number; rr: number }
  | { kind: 'tin'; points: number[] }
  | { kind: 'room'; code: string; host: string; players: number };

/** Everything a match needs before the first question: the seed (so the questions), the rival, and whether it posts. */
export type Setup = { seed: string; rival: Rival; me: Player | null; online: boolean };
