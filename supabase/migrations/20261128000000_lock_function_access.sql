-- US Tin: make function access match the intent on Supabase.
--
-- Supabase grants EXECUTE on every new function in `public` to `anon` and `authenticated` directly (default
-- privileges), so the `revoke execute ... from public` in the earlier migrations did not take it away. The functions
-- all check for a signed-in user themselves, so nothing was exposed, but access should not rely on that alone:
--
--   anyone:         the boards, game PIN lookups and outfit lookups (granted in the earlier migrations)
--   signed in only: playing (anonymous sign-ins count as signed in)
--   nobody:         internal helpers, which run only inside the functions above, as their owner
--
-- Apply after 20261126010000_player_outfits.sql. (Applied to the live project as us_tin_lock_down_function_access.)

revoke execute on function
  public.set_player(text, text), public.me(), public.find_opponent(), public.submit_run(text, int[], uuid, text, int),
  public.create_room(), public.delete_me(), public.my_league(), public.league_board(), public.set_outfit(jsonb)
from anon;

revoke execute on function
  public.settle_league(uuid), public.points_cap(), public.week_start(timestamptz), public.is_reserved_name(text),
  public.is_rolled_name(text), public.clean_outfit(jsonb)
from anon, authenticated;
