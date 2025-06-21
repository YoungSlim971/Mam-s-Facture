#!/usr/bin/env bash
set -e

# Installation script for macOS Apple Silicon
if [[ "$(uname)" != "Darwin" ]]; then
  echo "Ce script est destiné à macOS." >&2
  exit 1
fi

if [[ "$(uname -m)" != "arm64" ]]; then
  echo "\033[33m[installer] Ce script est optimisé pour les Mac Apple Silicon (arm64)\033[0m"
fi

cd "$(dirname "$0")"

if ! command -v brew >/dev/null 2>&1; then
  echo "[installer] Homebrew n'est pas installé. Installez-le depuis https://brew.sh/ puis relancez ce script." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[installer] Installation de Node.js via Homebrew..."
  brew install node
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[installer] Installation de pnpm..."
  npm install -g pnpm
fi

# Execute generic install script
./install.sh
