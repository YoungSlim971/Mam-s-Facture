#!/usr/bin/env bash
# Simple script to install project dependencies on macOS
set -euo pipefail

# Install Homebrew if missing
if ! command -v brew >/dev/null 2>&1; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  echo 'eval "$('/opt/homebrew/bin/brew' shellenv)"' >> "$HOME/.zprofile"
  eval "$('/opt/homebrew/bin/brew' shellenv)"
fi

# Ensure Node.js and pnpm are installed
if ! command -v node >/dev/null 2>&1; then
  brew install node@18
fi

if ! command -v pnpm >/dev/null 2>&1; then
  brew install pnpm
fi

# Install backend dependencies
cd backend
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install

cd ..
echo "Dependencies installed successfully."
