-- US Tin — hardening the Arena's leaderboard.
--
--   * Names that pretend to be the app, its mascot or its staff are refused (impersonation).
--   * A name can change at most once an hour (no churning names to dodge the board or to harass).
--   * Players can delete themselves: their name, every match and every game PIN they hosted, and the anonymous
--     account behind them (delete_me).
--   * Every function gets a statement timeout, so no single call can tie the database up.

-- ---------------------------------------------------------------------------
-- Reserved names
-- ---------------------------------------------------------------------------

-- Compared without case, spaces, dots, dashes or underscores, so "U.S. Tin", "us_tin" and "ADMIN" all match.
create or replace function public.is_reserved_name(p_name text)
returns boolean
language sql immutable set search_path = public as $$
  select regexp_replace(lower(coalesce(p_name, '')), '[ ._-]', '', 'g') = any (array[
    'tin', 'ustin', 'tinbot', 'admin', 'administrator', 'mod', 'moderator', 'staff', 'official', 'support',
    'help', 'system', 'root', 'owner', 'developer', 'dev', 'team', 'null', 'undefined', 'anonymous', 'you',
    'everyone', 'nobody', 'deleted', 'supabase'
  ]);
$$;

alter table public.players
  add constraint players_name_reserved check (not public.is_reserved_name(name)) not valid;
-- Validate separately so existing rows are checked without blocking writes for long.
alter table public.players validate constraint players_name_reserved;

-- ---------------------------------------------------------------------------
-- Rename limit
-- ---------------------------------------------------------------------------

alter table public.players add column if not exists renamed_at timestamptz;

create or replace function public.set_player(p_name text, p_paint text default 'green')
returns table (name text, paint text)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_paint text := coalesce(p_paint, 'green');
  v_old players%rowtype;
begin
  if v_uid is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;
  select * into v_old from players pl where pl.id = v_uid for update;
  if found and v_old.name is distinct from v_name and v_old.renamed_at > now() - interval '1 hour' then
    raise exception 'You can change your name once an hour' using errcode = '53400';
  end if;
  insert into players as pl (id, name, paint) values (v_uid, v_name, v_paint)
  on conflict (id) do update
    set name = excluded.name,
        paint = excluded.paint,
        renamed_at = case when pl.name is distinct from excluded.name then now() else pl.renamed_at end;
  return query select pl.name, pl.paint from players pl where pl.id = v_uid;
end;
$$;

-- ---------------------------------------------------------------------------
-- Delete my data
-- ---------------------------------------------------------------------------

-- Removes the signed-in player completely. Deleting the anonymous auth user cascades to their player row, and from
-- there to their matches and the game PINs they hosted. Other players' runs that raced them keep their own score.
create or replace function public.delete_me()
returns boolean
language plpgsql security definer set search_path = public, auth as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;
  delete from public.players where id = v_uid;
  delete from auth.users where id = v_uid;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Timeouts and grants
-- ---------------------------------------------------------------------------

alter function public.set_player(text, text) set statement_timeout = '3s';
alter function public.me() set statement_timeout = '3s';
alter function public.find_opponent() set statement_timeout = '3s';
alter function public.submit_run(text, int[], uuid, text, int) set statement_timeout = '3s';
alter function public.leaderboard(text, int) set statement_timeout = '5s';
alter function public.create_room() set statement_timeout = '3s';
alter function public.join_room(text) set statement_timeout = '3s';
alter function public.room_board(text) set statement_timeout = '3s';
alter function public.delete_me() set statement_timeout = '5s';

-- is_reserved_name is only for the table's check constraint, which runs as the functions' owner: nobody calls it.
revoke execute on function public.delete_me(), public.is_reserved_name(text) from public;
grant execute on function public.delete_me() to authenticated;
