#!/usr/bin/env bash
set -e

# Detect package manager (prefer pnpm, fallback to npm)
if command -v pnpm >/dev/null 2>&1; then
  PM=pnpm
else
  PM=npm
fi

echo "[installer] Utilisation de $PM pour installer les dépendances"

# Installer backend
echo "[installer] Installation des dépendances backend..."
(cd backend && "$PM" install)

# Installer frontend
echo "[installer] Installation des dépendances frontend..."
(cd frontend && "$PM" install)

# Construire le frontend
echo "[installer] Construction du frontend..."
(cd frontend && "$PM" run build)

echo "[installer] Installation terminée."

echo "Vous pouvez démarrer le backend avec : (cd backend && $PM start)"
echo "Et lancer le frontend en mode développement : (cd frontend && $PM run dev)"
