#!/usr/bin/env bash
set -euo pipefail

# Small helper to start mock + vite (if not already running), run Playwright E2E,
# then optionally teardown processes started by this script.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MOCK_PORT=${MOCK_PORT:-4000}
VITE_PORT=${VITE_PORT:-3000}
KEEP_RUNNING=false

usage(){
  cat <<EOF
Usage: $(basename "$0") [--keep]

Options:
  --keep    Do not kill servers started by this script after tests finish

This script will:
 - start the mock server (mock-server.cjs) on port ${MOCK_PORT} if not running
 - start Vite dev server on port ${VITE_PORT} if not running
 - wait for both to respond
 - run Playwright E2E using BASE_URL=http://localhost:${VITE_PORT}
EOF
}

while [[ ${#} -gt 0 ]]; do
  case "$1" in
    --keep) KEEP_RUNNING=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1"; usage; exit 1 ;;
  esac
done

cd "$ROOT_DIR"

log() { echo "[run-e2e] $*"; }

is_up(){
  local url="$1"
  if curl -sSf --max-time 2 "$url" > /dev/null 2>&1; then
    return 0
  fi
  return 1
}

start_mock(){
  if is_up "http://localhost:${MOCK_PORT}/api/subjects"; then
    log "Mock server already responding on port ${MOCK_PORT} (api/subjects)"
    return 0
  fi
  log "Starting mock server on port ${MOCK_PORT}..."
  nohup node mock-server.cjs > /tmp/mock-server.log 2>&1 &
  MOCK_PID=$!
  echo $MOCK_PID > /tmp/run-e2e-mock.pid
  log "Mock server pid: ${MOCK_PID} (logs: /tmp/mock-server.log)"
}

start_vite(){
  if is_up "http://localhost:${VITE_PORT}/"; then
    log "Vite already responding on port ${VITE_PORT}"
    return 0
  fi
  log "Starting Vite dev server on port ${VITE_PORT}..."
  nohup npm run dev -- --port ${VITE_PORT} > /tmp/vite-dev.log 2>&1 &
  VITE_PID=$!
  echo $VITE_PID > /tmp/run-e2e-vite.pid
  log "Vite pid: ${VITE_PID} (logs: /tmp/vite-dev.log)"
}

wait_for(){
  local url="$1"; local retries=60; local n=0
  until is_up "$url"; do
    n=$((n+1))
    if [ $n -ge $retries ]; then
      echo "Timed out waiting for $url" >&2
      return 1
    fi
    sleep 1
  done
  return 0
}

cleanup(){
  if [ "$KEEP_RUNNING" = true ]; then
    log "Leaving servers running (kept by --keep)"
    return
  fi
  if [ -f /tmp/run-e2e-vite.pid ]; then
    VPID=$(cat /tmp/run-e2e-vite.pid) || true
    if [ -n "${VPID:-}" ]; then
      log "Killing Vite pid ${VPID}" || true
      kill ${VPID} 2>/dev/null || true
      rm -f /tmp/run-e2e-vite.pid
    fi
  fi
  if [ -f /tmp/run-e2e-mock.pid ]; then
    MPID=$(cat /tmp/run-e2e-mock.pid) || true
    if [ -n "${MPID:-}" ]; then
      log "Killing mock pid ${MPID}" || true
      kill ${MPID} 2>/dev/null || true
      rm -f /tmp/run-e2e-mock.pid
    fi
  fi
}

trap 'cleanup' EXIT

start_mock
start_vite

log "Waiting for servers to become ready..."
# Check a known-200 endpoint on the mock server (root / returns 404)
wait_for "http://localhost:${MOCK_PORT}/api/subjects" || (cat /tmp/mock-server.log 2>/dev/null || true; exit 1)
wait_for "http://localhost:${VITE_PORT}/" || (cat /tmp/vite-dev.log 2>/dev/null || true; exit 1)

log "Running Playwright E2E (BASE_URL=http://localhost:${VITE_PORT})"
BASE_URL="http://localhost:${VITE_PORT}" npm run test:e2e
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  log "Playwright tests passed"
else
  log "Playwright tests failed with exit code ${EXIT_CODE}"
fi

exit $EXIT_CODE
