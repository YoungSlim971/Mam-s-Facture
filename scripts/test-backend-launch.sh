#!/usr/bin/env bash
set -euo pipefail

pnpm --filter backend dev &
PID=$!

for i in {1..10}; do
  RESP=$(curl -s http://localhost:3001/health || true)
  if [[ "$RESP" == '{"ok":true}' ]]; then
    SUCCESS=1
    break
  fi
  sleep 1
done

kill $PID || true

if [[ -n ${SUCCESS:-} ]]; then
  echo "Backend launch test succeeded"
  exit 0
else
  echo "Backend launch test failed"
  exit 1
fi
