# Application de Facturation Complète

Une application web moderne pour la gestion de factures, construite avec React côté frontend et Node.js/Express côté backend. Les données sont stockées dans une base SQLite (sql.js) et l'interface est entièrement en français avec export HTML imprimable.

## 🌟 Fonctionnalités principales
- **Interface utilisateur complète** avec navigation latérale
- **Gestion des factures** (CRUD) avec recherche et pagination
- **Gestion des clients** récurrents
- **Export HTML** prêt pour impression
- **Formatage français** des dates et montants

## 🚀 Installation et démarrage

Prérequis : Node.js 18+ et pnpm.

### Installation rapide
```bash
./install.sh        # installation complète
./install.sh --skip-build   # sans construction du frontend
```

### Démarrage en développement
```bash
cd backend && pnpm run dev &
cd ../frontend && pnpm run dev
```
L'interface est accessible sur http://localhost:5173 et l'API sur http://localhost:3001.

### Docker
```bash
./build-docker.sh
./run-docker.sh
```

### macOS : ouverture automatique
```bash
chmod +x MAMSFACTUREOPENER.sh
./MAMSFACTUREOPENER.sh
```

### Installation manuelle
1. Cloner le projet
   ```bash
   git clone <repo> Mam-s-Facture
   cd Mam-s-Facture
   ```
2. Installer les dépendances du backend
   ```bash
   cd backend
   pnpm install
   ```
3. Installer les dépendances du frontend
   ```bash
   cd ../frontend
   pnpm install
   ```

### Configuration API
Définissez la variable d'environnement `VITE_API_URL` dans `frontend/.env` pour spécifier l'URL de l'API.

### Jeton d'API
Définissez un jeton `apiToken` dans le `localStorage` :
```js
localStorage.setItem('apiToken', 'test-token');
```

### Génération locale
```bash
cd backend
pnpm run export-html <id_facture> [chemin_sortie]
```

### Migration de la base de données
```bash
cd backend
node database/migrations/002-add-legal-fields.js
```

## 🎁 Données de démonstration
Un jeu de données minimal est fourni dans `data/mockData`. Il permet de créer un
profil utilisateur, un client et plusieurs factures pour tester l'application.

```bash
node backend/scripts/seed-demo-data.js
```

Le script n'insère les données que si la base est vide afin de ne pas écraser un
travail existant. Il peut ainsi être lancé avant des tests manuels ou automatiqu
es pour disposer d'exemples réalistes.

Pour générer rapidement plusieurs factures supplémentaires liées aux clients existants :

```bash
node backend/scripts/generate-invoices.js 10
```

Le script crée un nombre donné de factures (10 par défaut) avec 50 % de statuts "paid" et 50 % "unpaid" puis les affiche dans la console.

## 📁 Structure du projet
```
Mam-s-Facture/
├── backend/                    # API Node.js/Express
│   ├── database/
│   │   ├── sqlite.js          # Gestionnaire de base de données SQLite
│   │   └── facturation.sqlite # Fichier de base de données
│   ├── server.ts              # Serveur Express principal
│   └── package.json           # Dépendances backend
├── frontend/                   # Application React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Accueil.tsx
│   │   │   ├── ListeFactures.tsx
│   │   │   ├── CreerFacture.tsx
│   │   │   ├── DetailFacture.tsx
│   │   │   └── ModifierFacture.tsx
│   │   └── components/        # Composants réutilisables
│   ├── App.tsx                # Application principale
│   └── package.json           # Dépendances frontend
└── README.md                  # Cette documentation
```

## 📄 Licence
Ce projet est fourni à des fins éducatives et de démonstration. Libre d'utilisation et modification.
