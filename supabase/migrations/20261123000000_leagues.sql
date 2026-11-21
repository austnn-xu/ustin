-- US Tin — leagues, a Pristine ladder, and a ceiling on every total.
--
-- Mirrors lib/leagues.js and lib/numbers.js (test/leagues.test.js keeps the numbers identical):
--
--   * Eight leagues: Bronze, Silver, Gold, Emerald, Diamond, Sapphire, Ruby, Pristine.
--   * Bronze–Ruby: each week a player joins a group of up to 30 players from their league on their first match. League
--     points are that week's match points. When the week ends the top of the group moves up and the bottom moves down.
--     Weeks are settled lazily, on each player's first action of a later week, so no scheduled job is needed.
--   * Pristine: one ladder ranked by RR (Valorant's Radiant). Quick matches against players move RR Elo-style; below
--     0 RR you drop to Ruby. Tin and game PINs never change RR.
--   * Quick match pairs players from the same league (and, in Pristine, the closest RR).
--   * Every total saturates at 9 quadrillion (points_cap), under JavaScript's exact-integer limit.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.points_cap()
returns bigint
language plpgsql immutable as $$
declare
  -- 9 quadrillion: the highest any total goes (lib/numbers.js MAX_POINTS).
  k_points_cap constant bigint := 9000000000000000;
begin
  return k_points_cap;
end;
$$;

-- Monday 00:00 UTC of the week containing p_at: when groups start and end.
create or replace function public.week_start(p_at timestamptz)
returns date
language sql immutable as $$
  select date_trunc('week', p_at at time zone 'utc')::date;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

alter table public.players
  add column if not exists league smallint not null default 0 check (league between 0 and 7),
  add column if not exists rr int not null default 0 check (rr >= 0),
  -- The latest week whose group result has been applied to this player.
  add column if not exists settled_through date;
create index if not exists players_pristine on public.players (rr desc, created_at) where league = 7;

create table public.league_groups (
  id bigint generated always as identity primary key,
  week date not null,
  league smallint not null check (league between 0 and 6),
  size int not null default 0 check (size between 0 and 30),
  created_at timestamptz not null default now()
);
create index league_groups_open on public.league_groups (week, league, id) where size < 30;

create table public.league_members (
  group_id bigint not null references public.league_groups (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  week date not null,
  points bigint not null default 0 check (points between 0 and 9000000000000000),
  matches int not null default 0,
  -- When the player last scored: on equal points, whoever got there first ranks higher.
  last_at timestamptz not null default now(),
  primary key (group_id, player_id),
  unique (player_id, week)
);
create index league_members_rank on public.league_members (group_id, points desc, last_at);

alter table public.league_groups enable row level security;
alter table public.league_members enable row level security;
revoke all on public.league_groups, public.league_members from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Settling a finished week (internal: called by the functions below)
-- ---------------------------------------------------------------------------

create or replace function public.settle_league(p_uid uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  -- Mirrors LEAGUES in lib/leagues.js, Bronze first.
  k_promote constant int[] := array[10, 10, 7, 7, 5, 5, 3, 0];
  k_demote constant int[] := array[0, 5, 5, 5, 5, 5, 5, 0];
  k_min_group_pristine constant int := 5;
  v_week date := public.week_start(now());
  v_player players%rowtype;
  v_member league_members%rowtype;
  v_group league_groups%rowtype;
  v_rank int;
  v_size int;
  v_up int;
  v_down int;
begin
  if p_uid is null then
    return;
  end if;
  select * into v_player from players p where p.id = p_uid for update;
  if not found then
    return;
  end if;
  select * into v_member from league_members m
  where m.player_id = p_uid and m.week < v_week and m.week > coalesce(v_player.settled_through, '-infinity'::date)
  order by m.week desc
  limit 1;
  if not found then
    return;
  end if;

  select * into v_group from league_groups g where g.id = v_member.group_id;
  select count(*) into v_size from league_members m where m.group_id = v_member.group_id;
  select 1 + count(*) into v_rank from league_members o
  where o.group_id = v_member.group_id
    and (o.points > v_member.points
      or (o.points = v_member.points and (o.last_at, o.player_id) < (v_member.last_at, v_member.player_id)));

  v_up := k_promote[v_group.league + 1];
  v_down := k_demote[v_group.league + 1];
  if v_player.league = v_group.league then
    if v_up > 0 and v_rank <= v_up and not (v_group.league = 6 and v_size < k_min_group_pristine) then
      update players p set league = p.league + 1, rr = 0 where p.id = p_uid;
    elsif v_down > 0 and v_rank > greatest(v_up, v_size - v_down) then
      update players p set league = p.league - 1 where p.id = p_uid;
    end if;
  end if;
  update players p set settled_through = v_member.week where p.id = p_uid;
end;
$$;

-- ---------------------------------------------------------------------------
-- Matches: submit_run now also scores the league (and RR in Pristine)
-- ---------------------------------------------------------------------------

drop function if exists public.submit_run(text, int[], uuid, text, int);

create function public.submit_run(
  p_seed text,
  p_points int[],
  p_rival_run uuid default null,
  p_room text default null,
  p_tin_score int default null
)
returns table (
  run_id uuid, outcome text, score int, earned int, rival_score int,
  league smallint, rr int, rr_change int, league_points bigint
)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
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
  -- Mirrors lib/leagues.js.
  k_group_size constant int := 30;
  k_rr_k constant int := 32;
  k_rr_min_win constant int := 5;
  k_rr_max constant int := 40;
  k_rr_vs_lower constant numeric := 0.75;

  v_uid uuid := auth.uid();
  v_week date := public.week_start(now());
  v_score int := 0;
  v_correct int := 0;
  v_streak int := 0;
  v_bonus int;
  v_p int;
  v_kind text;
  v_rival_run uuid;
  v_rival_score int;
  v_rival_league smallint;
  v_rival_rr int;
  v_room_seed text;
  v_outcome text;
  v_earned int;
  v_id uuid;
  v_league smallint;
  v_rr int;
  v_change int := 0;
  v_group bigint;
  v_league_points bigint := 0;
  v_expected numeric;
  v_result numeric;
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

  perform pg_advisory_xact_lock(hashtext('submit_run:' || v_uid::text));
  if exists (select 1 from match_runs r where r.player_id = v_uid and r.created_at > now() - k_cooldown) then
    raise exception 'Slow down: one match at a time' using errcode = '53400';
  end if;

  -- A new week? Apply last week's result before this match counts towards the new one.
  perform public.settle_league(v_uid);
  select pl.league, pl.rr into v_league, v_rr from players pl where pl.id = v_uid for update;

  if p_room is not null then
    select ro.seed into v_room_seed from rooms ro where ro.code = p_room and ro.created_at > now() - interval '7 days';
    if v_room_seed is null or v_room_seed <> p_seed then
      raise exception 'That game PIN has ended' using errcode = 'P0002';
    end if;
    if exists (select 1 from match_runs r where r.seed = v_room_seed and r.player_id = v_uid) then
      raise exception 'You already played this game' using errcode = '23505';
    end if;
    v_kind := 'room';
    select max(r.score) into v_rival_score from match_runs r where r.seed = v_room_seed and r.room_code = p_room;
  elsif p_rival_run is not null then
    select r.id, r.score, pl.league, pl.rr into v_rival_run, v_rival_score, v_rival_league, v_rival_rr
    from match_runs r join players pl on pl.id = r.player_id
    where r.id = p_rival_run and r.seed = p_seed and r.player_id <> v_uid;
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

  if v_league < 7 then
    -- This week's group: join the first open one for the league, or start a new one.
    select m.group_id into v_group from league_members m where m.player_id = v_uid and m.week = v_week;
    if v_group is null then
      select g.id into v_group from league_groups g
      where g.week = v_week and g.league = v_league and g.size < k_group_size
      order by g.id limit 1 for update skip locked;
      if v_group is null then
        insert into league_groups (week, league) values (v_week, v_league) returning id into v_group;
      end if;
      insert into league_members (group_id, player_id, week) values (v_group, v_uid, v_week);
      update league_groups g set size = g.size + 1 where g.id = v_group;
    end if;
    update league_members m
    set points = least(m.points + v_earned, public.points_cap()), matches = m.matches + 1, last_at = now()
    where m.group_id = v_group and m.player_id = v_uid
    returning m.points into v_league_points;
  elsif v_kind = 'player' then
    -- Pristine: RR, Elo-style, only against other players.
    v_expected := case
      when v_rival_league = 7 then 1 / (1 + power(10::numeric, (v_rival_rr - v_rr) / 400.0))
      else k_rr_vs_lower
    end;
    v_result := case v_outcome when 'win' then 1 when 'tie' then 0.5 else 0 end;
    -- floor(x + 0.5) rounds the way JavaScript's Math.round does.
    v_change := floor(k_rr_k * (v_result - v_expected) + 0.5)::int;
    if v_outcome = 'win' then
      v_change := greatest(v_change, k_rr_min_win);
    end if;
    v_change := greatest(-k_rr_max, least(k_rr_max, v_change));
    if v_rr + v_change < 0 then
      -- Out of Pristine: back to Ruby, and this week's Ruby group from the next match.
      update players pl set league = 6, rr = 0, settled_through = v_week - 7 where pl.id = v_uid;
      v_league := 6;
      v_rr := 0;
    else
      v_rr := v_rr + v_change;
      update players pl set rr = v_rr where pl.id = v_uid;
    end if;
  end if;

  return query select v_id, v_outcome, v_score, v_earned, v_rival_score, v_league, v_rr, v_change, v_league_points;
end;
$$;

-- ---------------------------------------------------------------------------
-- Equal-skill opponents
-- ---------------------------------------------------------------------------

drop function if exists public.find_opponent();

create function public.find_opponent()
returns table (run_id uuid, seed text, points int[], score int, name text, paint text, league smallint, rr int, played_at timestamptz)
language plpgsql volatile security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_league int := 0;
  v_rr int := 0;
begin
  perform public.settle_league(v_uid);
  select pl.league, pl.rr into v_league, v_rr from players pl where pl.id = v_uid;
  v_league := coalesce(v_league, 0);
  v_rr := coalesce(v_rr, 0);
  return query
  select r.id, r.seed, r.points, r.score, pl.name, pl.paint, pl.league, pl.rr, r.created_at
  from (
    select * from match_runs m
    where m.room_code is null and m.player_id is distinct from v_uid and m.created_at > now() - interval '60 days'
    order by m.created_at desc
    limit 1000
  ) r
  join players pl on pl.id = r.player_id
  -- Same league first; in Pristine, the closest RR (in bands of 100, so it is not always the same rival).
  order by abs(pl.league - v_league),
           case when v_league = 7 and pl.league = 7 then abs(pl.rr - v_rr) / 100 else 0 end,
           random()
  limit 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- Boards
-- ---------------------------------------------------------------------------

drop function if exists public.leaderboard(text, int);

-- The global board, now with each player's league, a default of the top 25, and totals capped.
create function public.leaderboard(p_period text default 'week', p_limit int default 25)
returns table (rank bigint, name text, paint text, points bigint, wins bigint, matches bigint, league smallint, rr int, is_me boolean)
language sql stable security definer set search_path = public as $$
  with totals as (
    select r.player_id,
           least(sum(r.earned), public.points_cap())::bigint as points,
           count(*) filter (where r.outcome = 'win') as wins,
           count(*) as matches
    from match_runs r
    where p_period = 'all'
       or r.created_at >= (date_trunc('week', now() at time zone 'utc') at time zone 'utc')
    group by r.player_id
  ),
  ranked as (
    select rank() over (order by t.points desc, t.wins desc) as rank, t.player_id, pl.name, pl.paint, t.points, t.wins,
           t.matches, pl.league, pl.rr
    from totals t join players pl on pl.id = t.player_id
  )
  select k.rank, k.name, k.paint, k.points, k.wins, k.matches, k.league, k.rr, coalesce(k.player_id = auth.uid(), false)
  from ranked k
  where k.rank <= least(greatest(coalesce(p_limit, 25), 1), 100) or k.player_id = auth.uid()
  order by k.rank, k.name;
$$;

-- Where the signed-in player stands: their league, this week's group place (or Pristine ladder place), and RR.
create or replace function public.my_league()
returns table (
  league smallint, rr int, week date, ends_at timestamptz,
  rank int, size int, points bigint, matches int,
  pristine_rank int, pristine_size int
)
language plpgsql volatile security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_week date := public.week_start(now());
  v_player players%rowtype;
  v_member league_members%rowtype;
  v_rank int;
  v_size int;
  v_prank int;
  v_psize int;
begin
  if v_uid is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;
  perform public.settle_league(v_uid);
  select * into v_player from players pl where pl.id = v_uid;
  if not found then
    return;
  end if;
  if v_player.league < 7 then
    select * into v_member from league_members m where m.player_id = v_uid and m.week = v_week;
    if found then
      select count(*) into v_size from league_members m where m.group_id = v_member.group_id;
      select 1 + count(*) into v_rank from league_members o
      where o.group_id = v_member.group_id
        and (o.points > v_member.points
          or (o.points = v_member.points and (o.last_at, o.player_id) < (v_member.last_at, v_member.player_id)));
    end if;
  else
    select count(*) into v_psize from players pl where pl.league = 7;
    select 1 + count(*) into v_prank from players pl
    where pl.league = 7 and (pl.rr > v_player.rr or (pl.rr = v_player.rr and (pl.created_at, pl.id) < (v_player.created_at, v_player.id)));
  end if;
  return query select v_player.league, v_player.rr, v_week, (v_week + 7)::timestamp at time zone 'utc',
    v_rank, v_size, coalesce(v_member.points, 0::bigint), coalesce(v_member.matches, 0), v_prank, v_psize;
end;
$$;

-- This week's group of the signed-in player, best first. Empty until their first match of the week.
create or replace function public.league_board()
returns table (rank bigint, name text, paint text, points bigint, matches int, is_me boolean)
language plpgsql volatile security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_group bigint;
begin
  if v_uid is null then
    return;
  end if;
  perform public.settle_league(v_uid);
  select m.group_id into v_group from league_members m where m.player_id = v_uid and m.week = public.week_start(now());
  if v_group is null then
    return;
  end if;
  return query
  select row_number() over (order by m.points desc, m.last_at, m.player_id), pl.name, pl.paint, m.points, m.matches, m.player_id = v_uid
  from league_members m join players pl on pl.id = m.player_id
  where m.group_id = v_group
  order by m.points desc, m.last_at, m.player_id;
end;
$$;

-- The Pristine ladder: everyone in Pristine by RR (top p_limit), plus the signed-in player wherever they are.
create or replace function public.pristine_board(p_limit int default 25)
returns table (rank bigint, name text, paint text, rr int, is_me boolean)
language sql stable security definer set search_path = public as $$
  with ladder as (
    select row_number() over (order by pl.rr desc, pl.created_at, pl.id) as rank, pl.id, pl.name, pl.paint, pl.rr
    from players pl where pl.league = 7
  )
  select l.rank, l.name, l.paint, l.rr, coalesce(l.id = auth.uid(), false)
  from ladder l
  where l.rank <= least(greatest(coalesce(p_limit, 25), 1), 100) or l.id = auth.uid()
  order by l.rank;
$$;

-- ---------------------------------------------------------------------------
-- Timeouts and grants
-- ---------------------------------------------------------------------------

alter function public.submit_run(text, int[], uuid, text, int) set statement_timeout = '3s';
alter function public.find_opponent() set statement_timeout = '3s';
alter function public.leaderboard(text, int) set statement_timeout = '5s';
alter function public.my_league() set statement_timeout = '3s';
alter function public.league_board() set statement_timeout = '3s';
alter function public.pristine_board(int) set statement_timeout = '3s';

revoke execute on function
  public.settle_league(uuid), public.points_cap(), public.week_start(timestamptz),
  public.submit_run(text, int[], uuid, text, int), public.find_opponent(), public.leaderboard(text, int),
  public.my_league(), public.league_board(), public.pristine_board(int)
from public;

grant execute on function public.leaderboard(text, int), public.pristine_board(int) to anon, authenticated;
grant execute on function
  public.submit_run(text, int[], uuid, text, int), public.find_opponent(), public.my_league(), public.league_board()
to authenticated;
