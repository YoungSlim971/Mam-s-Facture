#!/usr/bin/env bash
set -e

# ---------------------------------------------------------------
# Lanceur rapide pour macOS
# Permet de spécifier le navigateur via --browser=NAME ou de ne pas en ouvrir
# ---------------------------------------------------------------

if [[ "$(uname)" != "Darwin" ]]; then
  echo "Ce script est destiné à macOS." >&2
  exit 1
fi

BROWSER="Safari"
NO_BROWSER=0
for arg in "$@"; do
  case $arg in
    --browser=*) BROWSER="${arg#*=}" ;;
    --no-browser) NO_BROWSER=1 ;;
  esac
done

cd "$(dirname "$0")"

# Assure l'installation des dépendances si nécessaire
if [[ ! -d backend/node_modules || ! -d frontend/node_modules ]]; then
  echo "[launcher] Installation des dépendances manquantes..."
  ./install_macos.sh --skip-build
fi

PM=pnpm
if ! command -v pnpm >/dev/null 2>&1; then
  PM=npm
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[launcher] Node.js est requis. Installez-le avant de poursuivre." >&2
  exit 1
fi

echo "[launcher] Démarrage du backend..."
(cd backend && "$PM" start > ../backend.log 2>&1 &)
BACK_PID=$!

echo "[launcher] Démarrage du frontend..."
(cd frontend && "$PM" run dev > ../frontend.log 2>&1 &)
FRONT_PID=$!

sleep 3
URL="http://localhost:5173"
if [ "$NO_BROWSER" -eq 0 ]; then
  open -a "$BROWSER" "$URL"
  echo "[launcher] $BROWSER ouvert sur $URL"
else
  echo "[launcher] Application disponible sur $URL"
fi

trap "kill $BACK_PID $FRONT_PID" SIGINT
wait $FRONT_PID
