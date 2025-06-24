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

echo "[installer] Mise à jour de Homebrew..."
brew update >/dev/null

# Upgrade Node.js and pnpm if already installed
echo "[installer] Mise à niveau des paquets Homebrew..."
brew upgrade node pnpm >/dev/null || true

if ! command -v node >/dev/null 2>&1; then
  echo "[installer] Installation de Node.js via Homebrew..."
  brew install node
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[installer] Installation de pnpm via Homebrew..."
  brew install pnpm
fi

# Détermine si la version de Node est suffisante
NODE_MAJOR=$(node -v | sed 's/^v\([0-9]*\).*$/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "[installer] Mise à niveau de Node.js (>=18) via Homebrew..."
  brew install node
fi

# Exécute le script générique en transmettant les options reçues
./install.sh "$@"
