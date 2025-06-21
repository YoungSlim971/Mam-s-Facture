#!/usr/bin/env bash
set -e

# Launcher script for macOS
if [[ "$(uname)" != "Darwin" ]]; then
  echo "Ce script est destiné à macOS." >&2
  exit 1
fi

cd "$(dirname "$0")"

PM=pnpm
if ! command -v pnpm >/dev/null 2>&1; then
  PM=npm
fi

# Start backend in background
echo "[launcher] Démarrage du backend..."
(cd backend && "$PM" start > ../backend.log 2>&1 &)
BACK_PID=$!

# Start frontend in background (dev server)
echo "[launcher] Démarrage du frontend..."
(cd frontend && "$PM" run dev > ../frontend.log 2>&1 &)
FRONT_PID=$!

sleep 3
open -a Safari http://localhost:5173

echo "[launcher] Safari ouvert sur http://localhost:5173"

trap "kill $BACK_PID $FRONT_PID" SIGINT
wait $FRONT_PID
