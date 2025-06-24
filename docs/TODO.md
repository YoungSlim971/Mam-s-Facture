# Tâches Restantes

## 🔧 Backend (bugs & améliorations)
- **Bugs :**
    - Résoudre les problèmes de compilation du backend en mode développement pour les tests E2E.
    - Investiguer et corriger les incohérences des propriétés `emitter_*` dans `server.ts`.
- **Améliorations :**
    - Finaliser le nettoyage des types TypeScript dans le backend.
    - Mettre en place une gestion d'erreurs plus robuste et détaillée.
    - Optimiser les requêtes à la base de données si nécessaire.
    - Ajouter la validation des données d'entrée pour toutes les routes de l'API.

## 🎨 Frontend (UI, interactivités)
- **UI :**
    - Améliorer le design général de l'application pour une meilleure expérience utilisateur.
    - S'assurer de la responsivité de l'interface sur différentes tailles d'écran.
    - Ajouter un thème sombre ou permettre la personnalisation du thème.
- **Interactivités :**
    - Fluidifier les transitions et animations.
    - Optimiser le chargement des données et ajouter des indicateurs de chargement.
    - Améliorer la gestion du cache local pour éviter les rechargements inutiles.

## ⚙️ Tests & CI (couverture + actions GitHub)
- **Couverture de tests :**
    - Augmenter la couverture des tests unitaires pour le backend et le frontend.
    - Écrire des tests d'intégration pour les interactions critiques entre frontend et backend.
    - Réparer et stabiliser les tests E2E avec Playwright.
- **Actions GitHub (CI/CD) :**
    - Mettre en place un workflow GitHub Actions pour lancer les tests automatiquement à chaque push/pull request.
    - Configurer un déploiement automatique (par exemple sur une plateforme de staging ou de production) lorsque les tests passent sur la branche principale.
    - Ajouter un linter et un formateur de code au workflow pour maintenir la cohérence du code.

## 📦 Bonus (améliorations optionnelles)
- Mise en place d'un système de logging centralisé.
- Internationalisation (i18n) de l'application pour supporter plusieurs langues.
- Ajout de fonctionnalités collaboratives (si pertinent pour le projet).
- Optimisation des performances (ex: code splitting, lazy loading).
- Sécurisation avancée (ex: protection contre les attaques XSS, CSRF).
