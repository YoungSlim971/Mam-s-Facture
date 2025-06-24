#!/usr/bin/env bash
set -e

# ---------------------------------------------------------------
# MAMSFACTUREOPENER.sh
# Script unifié pour installer les dépendances et lancer l'application
# Fonctionne sur macOS (Intel ou Apple Silicon)
# ---------------------------------------------------------------

if [[ "$(uname)" != "Darwin" ]]; then
  echo "❌ Ce script est prévu pour macOS." >&2
  exit 1
fi

# Déplacement à la racine du projet
cd "$(dirname "$0")"

# Ajout d'Homebrew s'il est absent
if ! command -v brew >/dev/null 2>&1; then
  echo "🍺 Installation de Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [ -d /opt/homebrew/bin ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -d /usr/local/bin ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
else
  echo "🍺 Homebrew déjà présent"
fi

echo "🔄 Mise à jour de Homebrew..."
brew update >/dev/null

# Installation ou mise à niveau de Node.js et pnpm
if brew list node >/dev/null 2>&1; then
  brew upgrade node >/dev/null || true
else
  brew install node
fi

if brew list pnpm >/dev/null 2>&1; then
  brew upgrade pnpm >/dev/null || true
else
  brew install pnpm
fi

NODE_MAJOR=$(node -v | sed 's/^v\([0-9]*\).*$/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "🚀 Mise à niveau de Node.js (>=18)..."
  brew install node
fi

PM=pnpm

# Vérification des dossiers
if [ ! -d backend ]; then
  echo "❌ Dossier backend introuvable" >&2
  exit 1
fi
if [ ! -d frontend ]; then
  echo "❌ Dossier frontend introuvable" >&2
  exit 1
fi

echo "📦 Installation des dépendances backend..."
(cd backend && "$PM" install)

echo "📦 Installation des dépendances frontend..."
(cd frontend && "$PM" install)

echo "🚀 Démarrage du backend..."
(cd backend && "$PM" run dev > ../backend.log 2>&1 &)
BACK_PID=$!

echo "🚀 Démarrage du frontend..."
(cd frontend && "$PM" run dev > ../frontend.log 2>&1 &)
FRONT_PID=$!

sleep 5

URL="http://localhost:5173"
echo "🌐 Ouverture de Safari sur $URL..."
open -a Safari "$URL"

echo "🧹 Nettoyage des anciens scripts..."
rm -f install_macos.sh launch_safari.sh

echo "✅ Application en cours d'exécution. Appuyez sur Ctrl+C pour quitter."
trap "kill $BACK_PID $FRONT_PID" SIGINT
wait $FRONT_PID
