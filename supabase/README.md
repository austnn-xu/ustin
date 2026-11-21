# The Arena's leaderboard (Supabase)

The Arena's online half (the global leaderboard, rivals to race and game PINs) runs on a Supabase project. Without
one, the app still plays Arena matches against Tin and says the leaderboard is not connected.

## Set it up (about five minutes)

1. Create a project at [supabase.com](https://supabase.com) (the free tier is plenty to start).
2. **Turn on anonymous sign-ins:** Authentication → Sign In / Providers → *Allow anonymous sign-ins*. Players never
   make an account; choosing a leaderboard name signs the device in anonymously. Supabase recommends turning on
   CAPTCHA protection for anonymous sign-ins once the app is public, to stop bots creating accounts in bulk.
3. **Create the tables and functions:** run every file in `migrations/`, oldest first, in the SQL editor (or
   `supabase link` then `supabase db push` with the Supabase CLI).
4. **Point the app at it:** Project Settings → API gives a Project URL and a public `anon` key. Put them in
   `mobile/.env`:

   ```sh
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   Expo bakes these into the build, so restart `npm run web` and re-run `npm run publish:web` after setting them. The
   anon key is designed to be public (every visitor's browser gets it); it can only call the functions below. It is
   fine to commit `mobile/.env` so every build has it. Never put the `service_role` key anywhere in the app.

## What is in the database

| Table | Holds |
|---|---|
| `players` | One row per anonymous account: leaderboard name (unique, 2–16 characters) and Tin's paint colour for the avatar |
| `match_runs` | Every finished match: seed, points per question, score, rival, result, and the leaderboard points it earned |
| `rooms` | Game PINs: six digits → a seed, for a week |

Row level security is on with no policies, so the tables cannot be read or written directly. Everything goes through
these functions:

| Function | Who | Does |
|---|---|---|
| `leaderboard(period, limit)` | anyone | The top players this week (from Monday 00:00 UTC) or all time, plus your own row |
| `set_player(name, paint)` / `me()` | signed in | Pick or change your name; read it back |
| `find_opponent()` | signed in | A random recent run by someone else, to race on the same questions |
| `submit_run(seed, points, …)` | signed in | Re-scores a finished match and records it (see below) |
| `create_room()` / `join_room(code)` / `room_board(code)` | signed in / anyone | Game PINs and their podiums |
| `delete_me()` | signed in | Deletes the player, their matches, the PINs they hosted and the anonymous account |

Names that impersonate the app, Tin or staff are refused, a name can change once an hour, and every function has a
statement timeout. The full picture is in [`SECURITY.md`](../SECURITY.md).

## How much it trusts a submitted match

The questions are generated on the phone, so the server cannot check each answer. It bounds what a run can claim
instead, with the same scoring rules as `lib/arena.js` (a test keeps the numbers in step):

- exactly 10 answers; each is 0 or between 500 and 1,000 plus the streak bonus that position allows;
- the result is decided on the server from the rival's stored score (a player's run or a game PIN's best so far);
- one run per player per game PIN, and at least 20 seconds between runs.

That keeps it a friendly competition: the best a cheater can do is a perfect, instant match, which is also what the very
best players score. Beating Tin is self-reported, so it is worth half a win against a person.

## Testing the SQL locally

`tests/run.sh` applies the migration to a throwaway local Postgres (16+) with a small stand-in for Supabase's `auth`
schema, then walks `tests/arena.scenario.sql`: real and bogus submissions as three players. Errors are expected where
a step is meant to be refused, including reserved names, the rename limit and `delete_me`.

```sh
PGBIN=/usr/lib/postgresql/16/bin sh supabase/tests/run.sh
```
