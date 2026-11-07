#!/usr/bin/env sh
set -eu
# Explicit, operator-run PostgreSQL snapshot; never schedules or uploads private data.
: "${DATABASE_URL:?Set DATABASE_URL to the PostgreSQL instance to back up}"
directory="${1:-./backups}"
mkdir -p "$directory"
umask 077
output="$directory/daira-crm-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --format=custom --no-owner --no-acl --file="$output" "$DATABASE_URL"
pg_restore --list "$output" >/dev/null
printf 'Backup archive verified: %s\n' "$output"
