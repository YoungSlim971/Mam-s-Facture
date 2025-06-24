#!/usr/bin/env bash
set -e

# ---------------------------------------------------------------
# MAMSFACTUREOPENER.sh
# Repairs the project and launches the frontend dev server
# macOS only
# ---------------------------------------------------------------

trap 'echo "❌ An error occurred. Exiting." >&2' ERR

if [[ $(uname) != "Darwin" ]]; then
  echo "❌ This script is intended for macOS." >&2
  exit 1
fi

# Move to the directory containing this script (project root)
cd "$(dirname "$0")"

# Ensure we are in the root where frontend/ and backend/ exist
if [[ ! -d frontend || ! -d backend ]]; then
  echo "❌ Could not locate frontend/ or backend/ directories." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ pnpm is not installed. Please install it and try again." >&2
  exit 1
fi

echo "🧹 Cleaning project…"
rm -rf node_modules .pnpm-store pnpm-lock.yaml package-lock.json yarn.lock
rm -rf frontend/node_modules frontend/.pnpm-store frontend/pnpm-lock.yaml \
       frontend/package-lock.json frontend/yarn.lock

echo "🗑️ Removing Tailwind preflight.css files if any…"
find . -path '*preflight.css' -type f -exec rm -f {} +

echo "📦 Installing root dependencies…"
pnpm install

echo "📦 Installing frontend dependencies…"
(cd frontend && pnpm install)

echo "🚀 Launching app…"
cd frontend
echo "App running. Press CTRL+C to stop."
pnpm run dev

