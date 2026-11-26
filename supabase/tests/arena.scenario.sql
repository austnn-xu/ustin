-- Walks the leaderboard functions through real and bogus submissions as three players. Errors are expected where a
-- step is meant to be refused; read the output top to bottom. Run with supabase/tests/run.sh.
\set ON_ERROR_STOP 0
\set A '00000000-0000-0000-0000-00000000000a'
\set B '00000000-0000-0000-0000-00000000000b'
\set C '00000000-0000-0000-0000-00000000000c'
set role authenticated;
select set_config('request.jwt.claim.sub', :'A', false);
\echo == direct table access must fail
select * from players;
insert into match_runs (player_id, seed, points, score, correct, outcome, earned) values (:'A','x','{}',0,0,'solo',99999);
\echo == submit before a name
select * from submit_run('abc', array[0,0,0,0,0,0,0,0,0,0]);
\echo == bad names: a typed name, a malformed one, or one that is not three listed words is refused
select * from set_player('x');
select * from set_player('<script>');
select * from set_player('Alice');
select * from set_player('Alice Smith');
select * from set_player('happy mossy otter');
select * from set_player('Happy Otter');
select * from set_player('Happy Mossy Otter Extra');
select * from set_player('Otter Mossy Happy');
\echo == a rolled name (extra spaces are tidied first)
select * from set_player('   Happy   Mossy  Otter  ', 'blue');
select * from me();
\echo == impossible runs
select * from submit_run('abc', array[1500,0,0,0,0,0,0,0,0,0]);
select * from submit_run('abc', array[1000,1100,1200,1300,1400,1500,1500,1500,1500,99999]);
select * from submit_run('abc', array[0,0,0]);
select * from submit_run('ABC!', array[0,0,0,0,0,0,0,0,0,0]);
\echo == a real run vs Tin (win: +500)
select * from submit_run('abc', array[900,1000,0,800,1100,1200,0,0,700,850], p_tin_score => 5000);
\echo == cooldown
select * from submit_run('abc', array[0,0,0,0,0,0,0,0,0,0]);
reset role;
update match_runs set created_at = created_at - interval '1 minute';
set role authenticated;
select set_config('request.jwt.claim.sub', :'B', false);
\echo == the same rolled name is taken
select * from set_player('Happy Mossy Otter');
select * from set_player('Brave Frosty Fox', 'red');
\echo == B finds A as opponent and beats them (+1000)
select name, score, seed from find_opponent();
select * from submit_run('abc', array[1000,1100,1200,1300,1400,1500,1500,1500,1500,1500], p_rival_run => (select run_id from find_opponent()));
\echo == two rivals at once
reset role; update match_runs set created_at = created_at - interval '1 minute'; set role authenticated;
select * from submit_run('abc', array[0,0,0,0,0,0,0,0,0,0], p_tin_score => 1, p_room => '123456');
\echo == no rival at all: a solo run
select * from submit_run('zzz', array[0,0,0,0,0,0,0,0,0,0]);
\echo == rooms
select code ~ '^[0-9]{6}$' ok, seed like 'pin-%' seedok from create_room();
reset role; select code, seed from rooms \gset room_
set role authenticated; select set_config('request.jwt.claim.sub', :'B', false);
select code, host, players from join_room(:'room_code');
reset role; update match_runs set created_at = created_at - interval '1 minute'; set role authenticated;
select set_config('request.jwt.claim.sub', :'B', false);
select * from submit_run(:'room_seed', array[700,0,0,0,0,0,0,0,0,0], p_room => :'room_code');
reset role; update match_runs set created_at = created_at - interval '1 minute'; set role authenticated;
\echo == B again in the same game PIN: refused
select * from submit_run(:'room_seed', array[700,0,0,0,0,0,0,0,0,0], p_room => :'room_code');
\echo == wrong seed for room
select set_config('request.jwt.claim.sub', :'A', false);
select * from submit_run('abc', array[700,0,0,0,0,0,0,0,0,0], p_room => :'room_code');
select * from submit_run(:'room_seed', array[800,0,0,0,0,0,0,0,0,0], p_room => :'room_code');
select * from room_board(:'room_code');
\echo == leaderboards
select * from leaderboard('week');
select * from leaderboard('all', 1);
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
\echo == anon can read boards but not play
select * from leaderboard('all');
select * from create_room();
select * from find_opponent();
reset role;
\echo == C: own row outside top 1
set role authenticated; select set_config('request.jwt.claim.sub', :'C', false);
select * from set_player('Calm Golden Heron');
select * from submit_run('abc', array[0,0,0,0,0,0,0,0,0,500], p_tin_score => 9000);
select * from leaderboard('all', 1);

reset role;
update players set renamed_at = null;
\echo == hardening: reserved names are refused
set role authenticated; select set_config('request.jwt.claim.sub', :'C', false);
select * from set_player('U.S. Tin');
select * from set_player('ADMIN');
select * from set_player('tin');
\echo == hardening: one rename, then a second within the hour is refused
select * from set_player('Cheery Silver Finch');
select * from set_player('Bold Copper Lark');
\echo == hardening: changing only the paint is always fine
select * from set_player('Cheery Silver Finch', 'purple');
\echo == hardening: delete_me removes the player, their runs and their account
select * from delete_me();
reset role;
select (select count(*) from players where name in ('Calm Golden Heron', 'Cheery Silver Finch')) as players_left,
       (select count(*) from match_runs where player_id = :'C') as runs_left,
       (select count(*) from auth.users where id = :'C') as account_left;
\echo == hardening: anon cannot delete anyone
set role anon; select set_config('request.jwt.claim.sub', '', false);
select * from delete_me();
reset role;

-- ===========================================================================
-- Leagues (migration 20261123000000_leagues.sql)
-- ===========================================================================
reset role;
\set D '00000000-0000-0000-0000-00000000000d'
\set E '00000000-0000-0000-0000-00000000000e'
insert into auth.users values (:'D'), (:'E');
update match_runs set created_at = created_at - interval '1 minute';

\echo == leagues: everyone starts in Bronze (0); a first match this week joins a group
set role authenticated;
select set_config('request.jwt.claim.sub', :'D', false);
select * from set_player('Eager Sandy Koala');
select outcome, league, rr, rr_change, league_points from submit_run('lg1', array[1000,0,0,0,0,0,0,0,0,0], p_tin_score => 0);
select league, rank, size, points, matches from my_league();
select * from league_board();
reset role; update match_runs set created_at = created_at - interval '1 minute'; set role authenticated;
select set_config('request.jwt.claim.sub', :'E', false);
select * from set_player('Gentle Olive Lynx');
select league_points from submit_run('lg2', array[900,0,0,0,0,0,0,0,0,0]);
select rank, name, points from league_board();

\echo == leagues: the week ends (moved back 7 days); first action of the new week promotes Bronze players
reset role;
update league_members set week = week - 7;
update league_groups set week = week - 7;
update match_runs set created_at = created_at - interval '7 days';
set role authenticated;
select set_config('request.jwt.claim.sub', :'D', false);
select league, rank, size, points from my_league();
\echo == ...and is applied exactly once
select league from my_league();

\echo == leagues: a Gold group of 9 last week: top 7 go up to Emerald (3), ranks 8 and 9 drop to Silver (1)
reset role;
insert into auth.users select ('00000000-0000-0000-0000-0000000001' || lpad(i::text, 2, '0'))::uuid from generate_series(1, 9) i;
insert into players (id, name, league) select ('00000000-0000-0000-0000-0000000001' || lpad(i::text, 2, '0'))::uuid, 'Gold' || i, 2 from generate_series(1, 9) i;
with g as (insert into league_groups (week, league, size) values (week_start(now()) - 7, 2, 9) returning id)
insert into league_members (group_id, player_id, week, points)
select g.id, ('00000000-0000-0000-0000-0000000001' || lpad(i::text, 2, '0'))::uuid, week_start(now()) - 7, 1000 - i from g, generate_series(1, 9) i;
select p.name, p.league as before from players p where p.name in ('Gold1', 'Gold8', 'Gold9') order by p.name;
select settle_league(('00000000-0000-0000-0000-0000000001' || lpad(i::text, 2, '0'))::uuid) from generate_series(1, 9) i \g /dev/null
select p.name, p.league as after from players p where p.name in ('Gold1', 'Gold7', 'Gold8', 'Gold9') order by p.name;

\echo == Pristine: Elo RR. 100 RR beats a 500 RR player: +29 (lib/leagues.js agrees)
update players set league = 7, rr = 100 where id = :'D';
update players set league = 7, rr = 500 where id = :'E';
update match_runs set created_at = created_at - interval '1 minute';
set role authenticated;
select set_config('request.jwt.claim.sub', :'E', false);
select league_points from submit_run('lgp', array[600,0,0,0,0,0,0,0,0,0], p_tin_score => 0) \g /dev/null
select set_config('request.jwt.claim.sub', :'D', false);
\echo == find_opponent prefers the same league (Eli, Pristine)
select name, league, rr from find_opponent();
reset role; select id as eli_run from match_runs where seed = 'lgp' and player_id = :'E' \gset
set role authenticated; select set_config('request.jwt.claim.sub', :'D', false);
select outcome, league, rr, rr_change, league_points from submit_run('lgp', array[1000,0,0,0,0,0,0,0,0,0], p_rival_run => :'eli_run');
select league, rr, pristine_rank, pristine_size from my_league();
select * from pristine_board();
\echo == Pristine: a Tin match never moves RR
reset role; update match_runs set created_at = created_at - interval '1 minute'; set role authenticated;
select set_config('request.jwt.claim.sub', :'D', false);
select outcome, rr, rr_change from submit_run('lgt', array[1000,0,0,0,0,0,0,0,0,0], p_tin_score => 0);
\echo == Pristine: losing below 0 RR drops you to Ruby (6)
reset role; update players set rr = 1 where id = :'D'; update match_runs set created_at = created_at - interval '1 minute'; set role authenticated;
select outcome, league, rr, rr_change from submit_run('lgp', array[0,0,0,0,0,0,0,0,0,0], p_rival_run => :'eli_run');
\echo == ...and the next match joins a Ruby group for this week
reset role; update match_runs set created_at = created_at - interval '1 minute'; set role authenticated;
select league, league_points from submit_run('lgr', array[700,0,0,0,0,0,0,0,0,0], p_tin_score => 0);
select league, rank, size from my_league();

\echo == totals stop at 9 quadrillion
reset role;
update league_members set points = 8999999999999999 where player_id = :'D';
update match_runs set created_at = created_at - interval '1 minute';
set role authenticated; select set_config('request.jwt.claim.sub', :'D', false);
select league_points, league_points = 9000000000000000 as at_cap from submit_run('lgc', array[1000,1100,0,0,0,0,0,0,0,0], p_tin_score => 0);
reset role;
\echo == the global board: top 25 by default, with leagues
set role anon; select set_config('request.jwt.claim.sub', '', false);
select count(*) <= 25 as top25, bool_and(league between 0 and 7) as leagues from leaderboard('all');
reset role;
