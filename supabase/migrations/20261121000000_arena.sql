-- US Tin — the Arena's global leaderboard.
--
-- Players sign in anonymously (Supabase anonymous sign-ins), pick a name, and every finished match is submitted
-- through submit_run(), which re-scores the run with the same rules as lib/arena.js before it counts. Nothing is
-- written to these tables directly: row level security is on with no policies, and the functions below are the only
-- way in. test/arena.test.js checks the scoring constants here against lib/arena.js.
--
-- It is a friendly competition, not a casino: the server cannot see the questions being answered, so it bounds what a
-- run can claim (no impossible scores, one run per player per game PIN, a short cooldown between runs) rather than
-- proving every answer.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  -- The colour of the player's Tin, bought in the shop; it colours their avatar on the board.
  paint text not null default 'green',
  created_at timestamptz not null default now(),
  constraint players_name_shape check (char_length(name) between 2 and 16 and name ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]*$'),
  constraint players_paint check (paint in ('green', 'blue', 'red', 'orange', 'yellow', 'purple', 'brown', 'slate'))
);
create unique index players_name_unique on public.players (lower(name));

-- A game PIN: six digits that give everyone who enters them the same ten questions.
create table public.rooms (
  code text primary key check (code ~ '^[0-9]{6}$'),
  seed text not null unique,
  host uuid not null references public.players (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index rooms_host_recent on public.rooms (host, created_at desc);

create table public.match_runs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  seed text not null,
  room_code text,
  -- Points per question, in order. Zero is a wrong or missed answer.
  points int[] not null,
  score int not null,
  correct int not null,
  rival_kind text check (rival_kind in ('player', 'tin', 'room')),
  rival_run uuid references public.match_runs (id) on delete set null,
  rival_score int,
  outcome text not null check (outcome in ('win', 'loss', 'tie', 'solo')),
  -- Leaderboard points: the score plus the bonus for the result.
  earned int not null,
  created_at timestamptz not null default now()
);
create index match_runs_recent on public.match_runs (created_at desc);
create index match_runs_player_recent on public.match_runs (player_id, created_at desc);
create index match_runs_room on public.match_runs (seed) where room_code is not null;

alter table public.players enable row level security;
alter table public.rooms enable row level security;
alter table public.match_runs enable row level security;
revoke all on public.players, public.rooms, public.match_runs from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Players
-- ---------------------------------------------------------------------------

-- Create or rename the signed-in player. Raises 23505 (unique_violation) when the name is taken.
create or replace function public.set_player(p_name text, p_paint text default 'green')
returns table (name text, paint text)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_paint text := coalesce(p_paint, 'green');
begin
  if v_uid is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;
  insert into players as pl (id, name, paint) values (v_uid, v_name, v_paint)
  on conflict (id) do update set name = excluded.name, paint = excluded.paint;
  return query select pl.name, pl.paint from players pl where pl.id = v_uid;
end;
$$;

create or replace function public.me()
returns table (name text, paint text)
language sql stable security definer set search_path = public as $$
  select pl.name, pl.paint from players pl where pl.id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Matches
-- ---------------------------------------------------------------------------

-- A recent run by someone else to race against: same seed, same questions, their points revealed one by one.
create or replace function public.find_opponent()
returns table (run_id uuid, seed text, points int[], score int, name text, paint text, played_at timestamptz)
language sql volatile security definer set search_path = public as $$
  select r.id, r.seed, r.points, r.score, pl.name, pl.paint, r.created_at
  from (
    select * from match_runs
    where room_code is null and player_id is distinct from auth.uid() and created_at > now() - interval '60 days'
    order by created_at desc
    limit 500
  ) r
  join players pl on pl.id = r.player_id
  order by random()
  limit 1;
$$;

-- Submit a finished match. Exactly one rival: a player's run (p_rival_run), a game PIN (p_room), Tin (p_tin_score),
-- or none. Returns the result as the server scored it.
create or replace function public.submit_run(
  p_seed text,
  p_points int[],
  p_rival_run uuid default null,
  p_room text default null,
  p_tin_score int default null
)
returns table (run_id uuid, outcome text, score int, earned int, rival_score int)
language plpgsql security definer set search_path = public as $$
declare
  -- Mirrors MATCH and REWARDS in lib/arena.js.
  k_questions constant int := 10;
  k_max_points constant int := 1000;
  k_min_points constant int := 500;
  k_streak_step constant int := 100;
  k_streak_cap constant int := 500;
  k_points_win constant int := 1000;
  k_points_win_tin constant int := 500;
  k_points_tie constant int := 500;
  k_cooldown constant interval := interval '20 seconds';

  v_uid uuid := auth.uid();
  v_score int := 0;
  v_correct int := 0;
  v_streak int := 0;
  v_bonus int;
  v_p int;
  v_kind text;
  v_rival_run uuid;
  v_rival_score int;
  v_room_seed text;
  v_outcome text;
  v_earned int;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;
  if not exists (select 1 from players pl where pl.id = v_uid) then
    raise exception 'Pick a name first' using errcode = 'P0002';
  end if;
  if p_seed is null or p_seed !~ '^[a-z0-9-]{1,40}$' then
    raise exception 'Unknown match' using errcode = '22023';
  end if;
  if (p_rival_run is not null)::int + (p_room is not null)::int + (p_tin_score is not null)::int > 1 then
    raise exception 'One rival per match' using errcode = '22023';
  end if;

  -- Re-score the run: right number of questions, and every answer inside what the clock and the streak allow.
  if p_points is null or array_ndims(p_points) <> 1 or coalesce(array_length(p_points, 1), 0) <> k_questions then
    raise exception 'A match is % questions', k_questions using errcode = '22023';
  end if;
  foreach v_p in array p_points loop
    if v_p is null or v_p < 0 then
      raise exception 'Impossible score' using errcode = '22023';
    end if;
    if v_p = 0 then
      v_streak := 0;
      continue;
    end if;
    v_streak := v_streak + 1;
    v_bonus := least(k_streak_cap, greatest(0, v_streak - 1) * k_streak_step);
    if v_p < k_min_points + v_bonus or v_p > k_max_points + v_bonus then
      raise exception 'Impossible score' using errcode = '22023';
    end if;
    v_score := v_score + v_p;
    v_correct := v_correct + 1;
  end loop;

  -- One submission at a time per player, and not faster than a match can be played.
  perform pg_advisory_xact_lock(hashtext('submit_run:' || v_uid::text));
  if exists (select 1 from match_runs r where r.player_id = v_uid and r.created_at > now() - k_cooldown) then
    raise exception 'Slow down: one match at a time' using errcode = '53400';
  end if;

  if p_room is not null then
    select ro.seed into v_room_seed from rooms ro where ro.code = p_room and ro.created_at > now() - interval '7 days';
    if v_room_seed is null or v_room_seed <> p_seed then
      raise exception 'That game PIN has ended' using errcode = 'P0002';
    end if;
    if exists (select 1 from match_runs r where r.seed = v_room_seed and r.player_id = v_uid) then
      raise exception 'You already played this game' using errcode = '23505';
    end if;
    v_kind := 'room';
    -- In a game PIN you win by beating everyone who played before you.
    select max(r.score) into v_rival_score from match_runs r where r.seed = v_room_seed and r.room_code = p_room;
  elsif p_rival_run is not null then
    select r.id, r.score into v_rival_run, v_rival_score
    from match_runs r where r.id = p_rival_run and r.seed = p_seed and r.player_id <> v_uid;
    if v_rival_run is null then
      raise exception 'Unknown rival' using errcode = 'P0002';
    end if;
    v_kind := 'player';
  elsif p_tin_score is not null then
    if p_tin_score < 0 or p_tin_score > k_questions * (k_max_points + k_streak_cap) then
      raise exception 'Impossible score' using errcode = '22023';
    end if;
    v_kind := 'tin';
    v_rival_score := p_tin_score;
  end if;

  v_outcome := case
    when v_rival_score is null then 'solo'
    when v_score > v_rival_score then 'win'
    when v_score < v_rival_score then 'loss'
    else 'tie'
  end;
  v_earned := v_score + case
    when v_outcome = 'win' and v_kind = 'tin' then k_points_win_tin
    when v_outcome = 'win' then k_points_win
    when v_outcome = 'tie' then k_points_tie
    else 0
  end;

  insert into match_runs (player_id, seed, room_code, points, score, correct, rival_kind, rival_run, rival_score, outcome, earned)
  values (v_uid, p_seed, p_room, p_points, v_score, v_correct, v_kind, v_rival_run, v_rival_score, v_outcome, v_earned)
  returning id into v_id;

  return query select v_id, v_outcome, v_score, v_earned, v_rival_score;
end;
$$;

-- ---------------------------------------------------------------------------
-- The global leaderboard
-- ---------------------------------------------------------------------------

-- Everyone, ranked by leaderboard points: this week (from Monday 00:00 UTC) or all time. The signed-in player's own
-- row is always included, even outside the top.
create or replace function public.leaderboard(p_period text default 'week', p_limit int default 50)
returns table (rank bigint, name text, paint text, points bigint, wins bigint, matches bigint, is_me boolean)
language sql stable security definer set search_path = public as $$
  with totals as (
    select r.player_id,
           sum(r.earned)::bigint as points,
           count(*) filter (where r.outcome = 'win') as wins,
           count(*) as matches
    from match_runs r
    where p_period = 'all'
       or r.created_at >= (date_trunc('week', now() at time zone 'utc') at time zone 'utc')
    group by r.player_id
  ),
  ranked as (
    select rank() over (order by t.points desc, t.wins desc) as rank, t.player_id, pl.name, pl.paint, t.points, t.wins, t.matches
    from totals t join players pl on pl.id = t.player_id
  )
  select k.rank, k.name, k.paint, k.points, k.wins, k.matches, coalesce(k.player_id = auth.uid(), false) as is_me
  from ranked k
  where k.rank <= least(greatest(coalesce(p_limit, 50), 1), 100) or k.player_id = auth.uid()
  order by k.rank, k.name;
$$;

-- ---------------------------------------------------------------------------
-- Game PINs: play with friends
-- ---------------------------------------------------------------------------

create or replace function public.create_room()
returns table (code text, seed text)
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_seed text;
begin
  if v_uid is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;
  if not exists (select 1 from players pl where pl.id = v_uid) then
    raise exception 'Pick a name first' using errcode = 'P0002';
  end if;
  if (select count(*) from rooms ro where ro.host = v_uid and ro.created_at > now() - interval '1 hour') >= 10 then
    raise exception 'That is a lot of games. Try again in a bit' using errcode = '53400';
  end if;
  -- A PIN lasts a week; after that its six digits can be handed out again (its old runs stay tied to the old seed).
  delete from rooms ro where ro.created_at < now() - interval '7 days';
  for i in 1..20 loop
    v_code := lpad(floor(random() * 1000000)::int::text, 6, '0');
    v_seed := 'pin-' || v_code || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
    insert into rooms (code, seed, host) values (v_code, v_seed, v_uid) on conflict do nothing;
    if found then
      return query select v_code, v_seed;
      return;
    end if;
  end loop;
  raise exception 'Could not find a free game PIN' using errcode = '53400';
end;
$$;

create or replace function public.join_room(p_code text)
returns table (code text, seed text, host text, players bigint, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select ro.code, ro.seed, pl.name,
         (select count(*) from match_runs r where r.seed = ro.seed and r.room_code = ro.code),
         ro.created_at
  from rooms ro join players pl on pl.id = ro.host
  where ro.code = p_code and ro.created_at > now() - interval '7 days';
$$;

-- Everyone who has played a game PIN, best score first.
create or replace function public.room_board(p_code text)
returns table (rank bigint, name text, paint text, score int, correct int, is_me boolean, played_at timestamptz)
language sql stable security definer set search_path = public as $$
  select rank() over (order by r.score desc), pl.name, pl.paint, r.score, r.correct, coalesce(r.player_id = auth.uid(), false), r.created_at
  from rooms ro
  join match_runs r on r.seed = ro.seed and r.room_code = ro.code
  join players pl on pl.id = r.player_id
  where ro.code = p_code
  order by r.score desc, r.created_at;
$$;

-- ---------------------------------------------------------------------------
-- Who may call what
-- ---------------------------------------------------------------------------

revoke execute on function
  public.set_player(text, text), public.me(), public.find_opponent(), public.submit_run(text, int[], uuid, text, int),
  public.leaderboard(text, int), public.create_room(), public.join_room(text), public.room_board(text)
from public;

-- Anyone can look at the boards; playing needs a (possibly anonymous) sign-in.
grant execute on function public.leaderboard(text, int), public.join_room(text), public.room_board(text) to anon, authenticated;
grant execute on function
  public.set_player(text, text), public.me(), public.find_opponent(), public.submit_run(text, int[], uuid, text, int),
  public.create_room()
to authenticated;
