'use strict';

/**
 * Write the database half of leaderboard names: `supabase/migrations/20261126000000_rolled_names.sql`.
 *
 * The three word lists live in `lib/names.js` (the app rolls from them). The database has to hold the same lists so
 * that it can refuse any name that was not rolled. This script turns one into the other, and a test regenerates it to
 * make sure the committed migration still matches.
 *
 *   node supabase/gen-names-migration.js
 */

const fs = require('fs');
const path = require('path');
const names = require('../lib/names');

const FILE = path.join(__dirname, 'migrations', '20261126000000_rolled_names.sql');

function rows(slot, words) {
  const lines = [];
  for (let i = 0; i < words.length; i += 8) {
    lines.push('  ' + words.slice(i, i + 8).map((w) => `(${slot}, '${w}')`).join(', '));
  }
  return lines.join(',\n');
}

function build() {
  const all = [rows(1, names.FIRST), rows(2, names.MIDDLE), rows(3, names.LAST)].join(',\n');
  return `-- US Tin: leaderboard names are rolled, never typed.
--
-- A name is three words, one from each of three lists: "Happy Mossy Otter". The lists below are generated from
-- lib/names.js by supabase/gen-names-migration.js (do not edit them by hand; a test fails if they drift). With this
-- migration set_player refuses any NEW name that is not exactly one word from each list, so nothing else can ever be
-- put on the board, whatever a modified client sends. Names players already have are left alone.
--
-- Apply after 20261123000000_leagues.sql.

-- ---------------------------------------------------------------------------
-- The word lists
-- ---------------------------------------------------------------------------

create table public.name_words (
  slot smallint not null check (slot between 1 and 3),
  word text not null check (word ~ '^[A-Z][a-z]{2,8}$'),
  primary key (slot, word)
);
alter table public.name_words enable row level security;
revoke all on public.name_words from public, anon, authenticated;

insert into public.name_words (slot, word) values
${all};

-- ---------------------------------------------------------------------------
-- Room for three words (longest: nine letters x 3 + two spaces = 29)
-- ---------------------------------------------------------------------------

alter table public.players drop constraint players_name_shape;
alter table public.players
  add constraint players_name_shape check (char_length(name) between 2 and ${names.MAX_LENGTH} and name ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]*$');

-- ---------------------------------------------------------------------------
-- Is this a rolled name?
-- ---------------------------------------------------------------------------

create or replace function public.is_rolled_name(p_name text)
returns boolean
language sql stable security definer set search_path = public as $$
  with parts as (select string_to_array(coalesce(p_name, ''), ' ') as p)
  select coalesce(array_length(p, 1), 0) = 3
     and (
       select count(*) from public.name_words w
       where (w.slot = 1 and w.word = p[1]) or (w.slot = 2 and w.word = p[2]) or (w.slot = 3 and w.word = p[3])
     ) = 3
  from parts;
$$;

-- Only set_player (which runs as the owner) calls it.
revoke execute on function public.is_rolled_name(text) from public;

-- ---------------------------------------------------------------------------
-- set_player: new names must be rolled
-- ---------------------------------------------------------------------------

create or replace function public.set_player(p_name text, p_paint text default 'green')
returns table (name text, paint text)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\\s+', ' ', 'g'));
  v_paint text := coalesce(p_paint, 'green');
  v_old players%rowtype;
begin
  if v_uid is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;
  select * into v_old from players pl where pl.id = v_uid for update;
  -- Keeping the name you already have (only changing paint) is always fine; anything new must be rolled.
  if (not found or v_old.name is distinct from v_name) and not public.is_rolled_name(v_name) then
    raise exception 'Names are rolled: three words from the lists' using errcode = '22023';
  end if;
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
`;
}

if (require.main === module) {
  fs.writeFileSync(FILE, build());
  console.log(`wrote ${path.relative(process.cwd(), FILE)}`);
}

module.exports = { build, FILE };
