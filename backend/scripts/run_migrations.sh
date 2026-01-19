#!/usr/bin/env bash
set -euo pipefail

# Run SQL migrations in database/migrations in alphabetical order.
# Requires: mysql CLI available and env vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
# Usage: DB_HOST=... DB_USER=... DB_PASSWORD=... DB_NAME=... ./run_migrations.sh

DIR=$(cd "$(dirname "$0")/../../database/migrations" && pwd)

if [ -z "${DB_HOST-}" ] || [ -z "${DB_USER-}" ] || [ -z "${DB_NAME-}" ]; then
  echo "Please set DB_HOST, DB_USER and DB_NAME (DB_PASSWORD optional)"
  exit 1
fi

MYSQL_ARGS=( -h "$DB_HOST" -u "$DB_USER" )
if [ -n "${DB_PASSWORD-}" ]; then
  MYSQL_ARGS+=( -p"$DB_PASSWORD" )
fi

echo "Applying migrations from $DIR to database $DB_NAME on $DB_HOST"

# Ensure migrations table exists (run single-file safe create)
mysql "${MYSQL_ARGS[@]}" "$DB_NAME" -e "CREATE TABLE IF NOT EXISTS migrations (id INT PRIMARY KEY AUTO_INCREMENT, filename VARCHAR(255) NOT NULL UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

for f in "$DIR"/*.sql; do
  [ -e "$f" ] || continue
  fname=$(basename "$f")
  # check if already applied
  already=$(mysql "${MYSQL_ARGS[@]}" "$DB_NAME" -N -s -e "SELECT filename FROM migrations WHERE filename = '$(printf "%s" "$fname" | sed "s/'/\\\\'/g")' LIMIT 1;" || true)
  if [ -n "$already" ]; then
    echo "Skipping $fname (already applied)"
    continue
  fi
  echo "Applying $fname..."
  mysql "${MYSQL_ARGS[@]}" "$DB_NAME" < "$f"
  mysql "${MYSQL_ARGS[@]}" "$DB_NAME" -e "INSERT INTO migrations (filename) VALUES ('$(printf "%s" "$fname" | sed "s/'/\\\\'/g")');"
  echo "Applied $fname"
done

echo "All migrations processed."
