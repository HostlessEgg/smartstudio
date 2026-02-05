#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
IN_FILE="$ROOT_DIR/database/dump_seeded.sql"
OUT_FILE="$ROOT_DIR/database/dump_sanitized.sql"

if [ ! -f "$IN_FILE" ]; then
  echo "Input dump not found: $IN_FILE"
  exit 1
fi

# Simple sanitization: copy then replace emails and password hashes conservatively
cp "$IN_FILE" "$OUT_FILE"

# Replace email-like strings in single quotes with a redacted value
perl -pe "s/'[A-Za-z0-9._%+-]+\@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'/'redacted@example.test'/g" -i "$OUT_FILE"

# Replace bcrypt-like hashes in single quotes with placeholder
perl -pe "s/'\$2[aby]\$[^']*'/'REDACTED_HASH'/g" -i "$OUT_FILE"

ls -lh "$OUT_FILE"

echo "Sanitized dump written to $OUT_FILE"
