#!/usr/bin/env bash

# Copies Umami PostgreSQL data from UMAMI_BD_PROD to UMAMI_BD_NEW without
# exposing connection strings. The destination must already have its Prisma
# migrations applied. Use --dry-run first.

set -euo pipefail

readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly ENV_FILE="$PROJECT_ROOT/.externals/.env"
readonly DEFAULT_CUTOFF='2026-10-12T05:00:00Z'

MODE=initial
DRY_RUN=true
FROM=''
CUTOFF="$DEFAULT_CUTOFF"
STAGE_DIR=''

usage() {
  cat <<'USAGE'
Usage:
  scripts/migrate-prod-to-new.sh [options]

Options:
  --dry-run                 Inspect the planned copy only (default).
  --apply                   Perform the selected migration mode.
  --mode initial            Replace NEW business data, then import rows before --cutoff.
   --mode refresh            Replace rows in NEW from --from (inclusive) through --cutoff
                             (exclusive), then import the same source interval.
   --mode append-missing     Insert only missing analytics rows from PROD in the interval.
                             Existing rows and configuration in NEW are preserved.
   --from TIMESTAMP          Required with --mode refresh or --mode append-missing.
  --cutoff TIMESTAMP        Exclusive ISO-8601 upper bound. Default:
                            2026-10-12T05:00:00Z (2026-10-12 00:00 Peru).
  --help                    Show this help.

The script reads UMAMI_BD_PROD and UMAMI_BD_NEW only from .externals/.env and
never prints their values. It deliberately does not copy Prisma migration rows,
custom short domains, link-domain assignments, or link variables. Imported
links are forced to the default domain.
USAGE
}

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  if [[ -n "$STAGE_DIR" && -d "$STAGE_DIR" ]]; then
    rm -rf -- "$STAGE_DIR"
  fi
}

trap cleanup EXIT

while (($#)); do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      ;;
    --apply)
      DRY_RUN=false
      ;;
    --mode)
      MODE="${2:-}"
      shift
      ;;
    --from)
      FROM="${2:-}"
      shift
      ;;
    --cutoff)
      CUTOFF="${2:-}"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail "unknown option: $1"
      ;;
  esac
  shift
done

[[ "$MODE" == initial || "$MODE" == refresh || "$MODE" == append-missing ]] \
  || fail '--mode must be initial, refresh, or append-missing'
[[ -f "$ENV_FILE" ]] || fail "missing environment file: $ENV_FILE"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

[[ -n "${UMAMI_BD_PROD:-}" ]] || fail 'UMAMI_BD_PROD is not configured'
[[ -n "${UMAMI_BD_NEW:-}" ]] || fail 'UMAMI_BD_NEW is not configured'
[[ "$UMAMI_BD_PROD" != "$UMAMI_BD_NEW" ]] || fail 'source and destination connections must differ'
[[ -z "$FROM" || "$MODE" == refresh || "$MODE" == append-missing ]] \
  || fail '--from is valid only with --mode refresh or --mode append-missing'
[[ "$MODE" == initial || -n "$FROM" ]] \
  || fail '--from is required with --mode refresh or --mode append-missing'

psql_source() {
  psql "$UMAMI_BD_PROD" -X -v ON_ERROR_STOP=1 "$@"
}

psql_destination() {
  psql "$UMAMI_BD_NEW" -X -v ON_ERROR_STOP=1 "$@"
}

validate_timestamp() {
  local label="$1"
  local value="$2"
  date --utc --date="$value" '+%Y-%m-%d %H:%M:%S.%N+00' >/dev/null 2>&1 \
    || fail "invalid $label timestamp"
}

validate_timestamp cutoff "$CUTOFF"
if [[ -n "$FROM" ]]; then
  validate_timestamp from "$FROM"
fi

# `date` both validates and normalizes the only values interpolated into SQL.
# The resulting fixed numeric format contains no SQL-significant characters.
CUTOFF="$(date --utc --date="$CUTOFF" '+%Y-%m-%d %H:%M:%S.%N+00')"
if [[ -n "$FROM" ]]; then
  FROM="$(date --utc --date="$FROM" '+%Y-%m-%d %H:%M:%S.%N+00')"
  [[ "$FROM" < "$CUTOFF" ]] || fail '--from must be earlier than --cutoff'
fi

SOURCE_DB="$(psql_source -Atc 'SELECT current_database()')"
DESTINATION_DB="$(psql_destination -Atc 'SELECT current_database()')"
[[ "$SOURCE_DB" != "$DESTINATION_DB" ]] || fail 'source and destination database names must differ'

readonly -a IMPORT_ORDER=(
  user
  team
  team_user
  two_factor_auth
  two_factor_backup_code
  api_key
  app_setting
  website
  annotation
  board
  pixel
  report
  segment
  share
  link
  session
  website_event
  event_data
  session_data
  session_link
  revenue
  heatmap_event
  session_replay_saved
  session_replay
)

# This mode is intentionally analytics-only. Configuration is compared first
# and remains untouched because NEW can already receive live traffic/settings.
readonly -a APPEND_MISSING_ORDER=(
  session
  website_event
  event_data
  session_data
  session_link
  revenue
  heatmap_event
  session_replay_saved
  session_replay
)

declare -a TABLES
if [[ "$MODE" == append-missing ]]; then
  TABLES=("${APPEND_MISSING_ORDER[@]}")
else
  TABLES=("${IMPORT_ORDER[@]}")
fi

readonly -a DESTINATION_BUSINESS_TABLES=(
  annotation
  api_key
  app_setting
  board
  event_data
  heatmap_event
  link
  link_domain
  link_variable
  pixel
  report
  revenue
  segment
  session
  session_data
  session_link
  session_replay
  session_replay_saved
  share
  short_domain
  team
  team_user
  two_factor_auth
  two_factor_backup_code
  two_factor_otp_used
  two_factor_rate_limit
  user
  website
  website_event
)

readonly -a REFRESH_DELETE_ORDER=(
  event_data
  heatmap_event
  revenue
  session_replay
  session_replay_saved
  session_link
  session_data
  website_event
  session
  link
  share
  segment
  report
  pixel
  board
  annotation
  website
  api_key
  two_factor_backup_code
  two_factor_auth
  team_user
  team
  user
)

has_created_at() {
  local table="$1"
  [[ "$(psql_source -Atc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '$table' AND column_name = 'created_at')")" == t ]]
}

common_columns() {
  local table="$1"
  psql_source -Atc "
    SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '$table'
      -- This legacy column was removed from the current schema. Share rows
      -- remain available independently and the current schema has no target
      -- field to receive this obsolete shortcut.
      AND NOT (table_name = 'website' AND column_name = 'share_id');"
}

source_filter() {
  local table="$1"
  local filter='TRUE'

  if has_created_at "$table"; then
    filter="created_at < '$CUTOFF'::timestamptz"
    if [[ -n "$FROM" ]]; then
      filter="created_at >= '$FROM'::timestamptz AND $filter"
    fi
  fi

  printf '%s' "$filter"
}

count_source_rows() {
  local table="$1"
  local filter
  filter="$(source_filter "$table")"
  psql_source -Atc "SELECT count(*) FROM \"$table\" WHERE $filter"
}

count_destination_rows() {
  local table="$1"
  psql_destination -At -c "SELECT count(*) FROM \"$table\""
}

print_plan() {
  printf 'source_database=%s\n' "$SOURCE_DB"
  printf 'destination_database=%s\n' "$DESTINATION_DB"
  printf 'mode=%s\n' "$MODE"
  printf 'from=%s\n' "${FROM:-unbounded}"
  printf 'cutoff_exclusive=%s\n' "$CUTOFF"
  printf 'link_policy=default-domain-only\n'
  printf 'excluded_tables=link_domain,short_domain,link_variable,_prisma_migrations,two_factor_otp_used,two_factor_rate_limit\n'
  printf '%-24s %14s %14s\n' table source_rows destination_rows

  local table
  for table in "${TABLES[@]}"; do
    printf '%-24s %14s %14s\n' "$table" "$(count_source_rows "$table")" "$(count_destination_rows "$table")"
  done
}

write_initial_clear() {
  local table_list=''
  local table
  for table in "${DESTINATION_BUSINESS_TABLES[@]}"; do
    table_list+="\"$table\", "
  done
  table_list="${table_list%, }"
  printf 'TRUNCATE TABLE %s;\n' "$table_list"
}

write_refresh_window_clear() {
  local table
  for table in "${REFRESH_DELETE_ORDER[@]}"; do
    if psql_destination -Atc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '$table' AND column_name = 'created_at')" | grep -qx t; then
      printf 'DELETE FROM "%s" WHERE created_at >= %q::timestamptz AND created_at < %q::timestamptz;\n' \
        "$table" "'$FROM'" "'$CUTOFF'"
    fi
  done
}

stage_table() {
  local table="$1"
  local columns filter select_columns
  columns="$(common_columns "$table")"
  [[ -n "$columns" ]] || fail "no shared columns found for $table"
  filter="$(source_filter "$table")"
  select_columns="$columns"

  if [[ "$table" == link ]]; then
    select_columns="$select_columns, TRUE AS is_default_domain_enabled"
  fi

  printf 'staging=%s\n' "$table"
  psql_source -q -c "COPY (SELECT $select_columns FROM \"$table\" WHERE $filter) TO STDOUT WITH (FORMAT csv)" \
    > "$STAGE_DIR/$table.csv"
}

write_table_copy() {
  local table="$1"
  local columns
  columns="$(common_columns "$table")"
  if [[ "$table" == link ]]; then
    columns="$columns, is_default_domain_enabled"
  fi
  printf '\\copy "%s" (%s) FROM %q WITH (FORMAT csv)\n' "$table" "$columns" "$STAGE_DIR/$table.csv"
}

write_append_missing_copy() {
  local table="$1"
  local columns stage_table
  columns="$(common_columns "$table")"
  stage_table="stage_${table}"

  printf 'CREATE TEMP TABLE "%s" (LIKE "%s" INCLUDING DEFAULTS) ON COMMIT DROP;\n' \
    "$stage_table" "$table"
  printf '\\copy "%s" (%s) FROM %q WITH (FORMAT csv)\n' \
    "$stage_table" "$columns" "$STAGE_DIR/$table.csv"
  printf 'INSERT INTO "%s" (%s) SELECT %s FROM "%s" ON CONFLICT DO NOTHING;\n' \
    "$table" "$columns" "$columns" "$stage_table"
}

print_plan

if [[ "$DRY_RUN" == true ]]; then
  printf 'result=dry-run; no database rows were changed\n'
  exit 0
fi

STAGE_DIR="$(mktemp -d /tmp/opencode/umami-migration.XXXXXXXX)"
chmod 700 "$STAGE_DIR"

for table in "${TABLES[@]}"; do
  stage_table "$table"
done

SQL_FILE="$STAGE_DIR/import.sql"
{
  printf 'BEGIN;\n'
  if [[ "$MODE" == initial ]]; then
    printf 'clearing_destination_business_data=true\n' >&2
    write_initial_clear
  elif [[ "$MODE" == refresh ]]; then
    printf 'clearing_destination_window=true\n' >&2
    write_refresh_window_clear
  else
    printf 'preserving_destination_rows=true\n' >&2
  fi
  for table in "${TABLES[@]}"; do
    if [[ "$MODE" == append-missing ]]; then
      write_append_missing_copy "$table"
    else
      write_table_copy "$table"
    fi
  done
  printf 'COMMIT;\n'
} > "$SQL_FILE"

printf 'importing_staged_rows_in_one_destination_transaction=true\n'
psql_destination -v ON_ERROR_STOP=1 -q -f "$SQL_FILE"

printf '%-24s %14s\n' table destination_rows_after
for table in "${TABLES[@]}"; do
  printf '%-24s %14s\n' "$table" "$(count_destination_rows "$table")"
done

printf 'result=applied\n'
