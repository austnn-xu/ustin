-- US Tin: players are drawn as their own Tin, wearing what they bought in the shop.
--
-- A player's outfit is the hat, glasses and neckwear they have equipped: {"hat": "hat-cap", "eyes": "eyes-shades"}.
-- (Paint colour is already stored as players.paint.) The app saves it with set_outfit() and fetches other players'
-- outfits for the names on screen with player_outfits(), so none of the board functions had to change.
--
-- The database does not know the shop's catalogue, so it only accepts values that look like an item id for that slot
-- ("hat-" followed by letters). The app checks every outfit it receives against the real catalogue before drawing it,
-- so an id that is not in the shop simply draws as nothing.
--
-- Apply after 20261126000000_rolled_names.sql.

alter table public.players add column if not exists outfit jsonb not null default '{}'::jsonb;

-- Keep only the three wearable slots, each with a well-formed id: anything else is dropped, never stored.
create or replace function public.clean_outfit(p_outfit jsonb)
returns jsonb
language sql immutable set search_path = public as $$
  select coalesce(jsonb_object_agg(s.slot, p_outfit ->> s.slot), '{}'::jsonb)
  from unnest(array['hat', 'eyes', 'neck']) as s(slot)
  where jsonb_typeof(p_outfit) = 'object'
    and (p_outfit ->> s.slot) ~ ('^' || s.slot || '-[a-z]{2,12}$');
$$;

alter table public.players
  add constraint players_outfit_shape check (jsonb_typeof(outfit) = 'object' and outfit = public.clean_outfit(outfit));

-- Save what I am wearing. Returns what was kept.
create or replace function public.set_outfit(p_outfit jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_outfit jsonb := public.clean_outfit(p_outfit);
begin
  if v_uid is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;
  update players set outfit = v_outfit where id = v_uid;
  return v_outfit;
end;
$$;

-- The outfits of the players with these names (at most 100 per call), for drawing a board or a match.
create or replace function public.player_outfits(p_names text[])
returns table (name text, outfit jsonb)
language sql stable security definer set search_path = public as $$
  select pl.name, pl.outfit
  from players pl
  where lower(pl.name) in (select lower(n) from unnest(coalesce(p_names[1:100], array[]::text[])) as n);
$$;

alter function public.set_outfit(jsonb) set statement_timeout = '3s';
alter function public.player_outfits(text[]) set statement_timeout = '3s';

revoke execute on function public.clean_outfit(jsonb), public.set_outfit(jsonb), public.player_outfits(text[]) from public;
-- clean_outfit is only used by the table's check constraint and set_outfit, which run as the owner.
grant execute on function public.player_outfits(text[]) to anon, authenticated;
grant execute on function public.set_outfit(jsonb) to authenticated;
