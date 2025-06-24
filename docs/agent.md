# Agent CLI

Ce document decrit le fonctionnement de l'agent automatique utilisé dans le projet.

---

## 🔁 Mise à jour du 24/06/2025 – Génération automatique de tests UI

### Nouvelle fonctionnalité :
L’agent IA détecte désormais les tâches liées à l’interface utilisateur (UI) dans le fichier `docs/TODO.md`, et génère automatiquement un fichier de test unitaire à l’aide d’un prompt intelligent envoyé à Codex.

### Fonctionnement :
- Lorsqu’une tâche contient des mots-clés liés à l’UI (ex : "badge", "affichage", "clic", "composant", etc.), l’agent déclenche un générateur de test.
- Le test est créé dans un fichier `.test.tsx` dans le dossier `__tests__/`
- Il utilise `@testing-library/react`
- Il inclut une limite de temps (`jest.setTimeout(5000)`) pour éviter les blocages

### Exemple de tâche déclencheuse :

	•	UI – corriger le badge de statut “Payée”

### Objectif :
Maximiser la couverture des tests sur tous les composants interactifs de l’application, de manière autonome.
