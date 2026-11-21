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
\echo == bad names
select * from set_player('x');
select * from set_player('<script>');
select * from set_player('   Alice   Smith  ', 'blue');
select * from set_player('Alice', 'blue');
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
select * from set_player('alice');
select * from set_player('Bob', 'red');
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
select * from set_player('Cara');
select * from submit_run('abc', array[0,0,0,0,0,0,0,0,0,500], p_tin_score => 9000);
select * from leaderboard('all', 1);
