#!/usr/bin/env bash
set -e

# ---------------------------------------------------------------
# Script d'installation principal
# - Vérifie la présence de Node.js (>=18)
# - Choisit pnpm ou npm selon la disponibilité
# - Peut ignorer la construction du frontend via --skip-build
# ---------------------------------------------------------------

usage() {
  echo "Usage: $0 [--skip-build]"
  echo "  --skip-build    n'effectue pas la construction du frontend"
}

SKIP_BUILD=0
for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Option inconnue: $arg"; usage; exit 1 ;;
  esac
done

if ! command -v node >/dev/null 2>&1; then
  echo "[installer] Node.js est requis. Installez-le puis réessayez." >&2
  exit 1
fi

NODE_MAJOR=$(node -v | sed 's/^v\([0-9]*\).*$/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "[installer] Node.js 18 ou supérieur est requis (version actuelle: $(node -v))." >&2
  exit 1
fi

# Détecte le gestionnaire de paquets (pnpm en priorité)
if command -v pnpm >/dev/null 2>&1; then
  PM=pnpm
else
  PM=npm
fi

echo "[installer] Utilisation de $PM pour installer les dépendances"

echo "[installer] Installation des dépendances backend..."
(cd backend && "$PM" install)

echo "[installer] Installation des dépendances frontend..."
(cd frontend && "$PM" install)

if [ "$SKIP_BUILD" -eq 0 ]; then
  echo "[installer] Construction du frontend..."
  (cd frontend && "$PM" run build)
else
  echo "[installer] Construction du frontend ignorée (--skip-build)"
fi

echo "[installer] Installation terminée."

echo "Vous pouvez démarrer le backend avec : (cd backend && $PM start)"
echo "Et lancer le frontend en mode développement : (cd frontend && $PM run dev)"
