#!/bin/sh
# Apply the Arena migration to a throwaway local Postgres (16+) and walk it through arena.scenario.sql.
# Needs initdb/pg_ctl/psql on PATH or PGBIN set, e.g. PGBIN=/usr/lib/postgresql/16/bin.
set -e
cd "$(dirname "$0")"
BIN=${PGBIN:+$PGBIN/}
DIR=$(mktemp -d)
trap '${BIN}pg_ctl -D "$DIR/data" stop -m immediate >/dev/null 2>&1; rm -rf "$DIR"' EXIT
${BIN}initdb -D "$DIR/data" -A trust -U postgres >/dev/null
${BIN}pg_ctl -D "$DIR/data" -o "-p 54329 -k $DIR -c listen_addresses=''" -l "$DIR/log" -w start >/dev/null
P="${BIN}psql -h $DIR -p 54329 -U postgres -q -d postgres"
$P -v ON_ERROR_STOP=1 -f supabase-stub.sql
$P -v ON_ERROR_STOP=1 -f ../migrations/20261121000000_arena.sql
$P -f arena.scenario.sql
