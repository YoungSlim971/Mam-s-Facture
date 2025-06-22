# Application de Facturation Complète

Une application web moderne et complète pour la gestion de factures, développée avec React, Node.js, et stockage JSON. Interface entièrement en français avec export HTML imprimable.

Pour une installation simplifiée, lancez `./install.sh` à la racine du projet. Ce script installe toutes les dépendances et construit automatiquement le frontend.

## 🌟 Fonctionnalités principales

-### ✅ Interface utilisateur complète
- **Page d'accueil** avec navigation intuitive et barre latérale
- **Gestion complète des factures** (CRUD)
- **Recherche et filtrage** par client, période, montant
- **Pagination** pour une navigation fluide
- **Interface responsive** adaptée à tous les écrans

### ✅ Gestion de factures
- **Création de factures** avec formulaire interactif
- **Modification en temps réel** de factures existantes
- **Calculs automatiques** des montants et totaux
- **Validation** des données côté client et serveur
- **Numérotation automatique** des factures

### ✅ Fonctionnalités avancées
- **Export HTML** prêt pour impression
- **Formatage français** des dates (DD/MM/YYYY) et devises (€)
- **Stockage persistant** avec fichiers JSON
- **API RESTful** complète avec gestion d'erreurs
- **Interface entièrement en français**

### ✅ Gestion des clients
- Informations client complètes (nom, entreprise, téléphone, adresse)
- Recherche rapide par nom de client ou entreprise
- Historique des factures par client
- Nouvelle page "Clients" pour créer et lister des clients récurrents

## 🚀 Installation et démarrage

### Prérequis
- Node.js 18+ 
- pnpm (ou npm)

### Installation rapide

Exécutez le script `install.sh` à la racine du projet. Il vérifie la version de Node.js (>=18), détecte automatiquement `pnpm` (ou `npm`), gère l'installation du backend et du frontend puis construit ce dernier. Vous pouvez passer l'option `--skip-build` pour ignorer la construction du frontend :

```bash
./install.sh        # installation complète
./install.sh --skip-build   # sans construction du frontend
```

### Installation macOS (Apple Silicon)

Un script spécifique `install_macos.sh` simplifie l'installation sur macOS avec processeur Apple Silicon. Il vérifie que Homebrew, Node.js et pnpm sont présents puis appelle `install.sh`. Les mêmes options peuvent lui être passées :

```bash
./install_macos.sh --skip-build
```

### Installation manuelle

1. **Cloner ou télécharger le projet**
   ```bash
   cd Mam-s-Facture
   ```

2. **Installer les dépendances du backend**
   ```bash
   cd backend
   pnpm install
   ```

3. **Installer les dépendances du frontend**
   ```bash
   cd ../frontend
   pnpm install
   ```

### Packages recommandés

Pour enrichir la mise en page et les exports des factures, vous pouvez installer :

- **Handlebars** ou **EJS** pour générer l'HTML
- **easyinvoice** pour un modèle prêt à l'emploi
- **Tailwind CSS** et **Paged.js** pour le style et l'impression
- **Puppeteer**, **pdfmake**, **docx**, **exceljs** pour exporter en PDF ou Office
- **date-fns**, **numeral**, **decimal.js** pour le formatage et les calculs

Installation rapide :

```bash
pnpm add handlebars tailwindcss pagedjs date-fns numeral decimal.js qrcode
# Export optionnels
pnpm add puppeteer pdfmake docx exceljs
```

### Démarrage

1. **Démarrer le serveur backend**
   ```bash
   cd backend
   pnpm start
   # ou pour le développement: pnpm run dev
   ```
   Le serveur démarre sur http://localhost:3001

2. **Démarrer l'interface frontend**
   ```bash
   cd frontend
  pnpm run dev
  ```
  L'application est accessible sur http://localhost:5173

### Configuration de l'URL API (VITE_API_URL)

L'interface frontend lit l'adresse de l'API via la variable d'environnement `VITE_API_URL`.
Si cette variable n'est pas définie, l'URL par défaut `http://localhost:3001/api` est utilisée (voir `frontend/src/lib/api.ts`).

Exemples :

- **Développement** : créer un fichier `.env` dans `frontend/` contenant
  ```bash
  VITE_API_URL=http://localhost:3001/api
  ```

- **Production** : définir la variable lors du build ou sur votre hébergeur
  ```bash
    VITE_API_URL=https://mon-domaine.com/api pnpm run build
    ```

### Génération Mistral (OPENROUTER_API_KEY)

L'endpoint `/api/factures/:id/mistral-html` permet de générer une facture en HTML via le modèle **Mistral**. Pour utiliser cette fonctionnalité, définissez la variable d'environnement `OPENROUTER_API_KEY` côté backend :

```bash
export OPENROUTER_API_KEY=ma-cle-api
pnpm start
```

Si la variable n'est pas présente, l'API renverra une erreur « OPENROUTER_API_KEY env var missing » lors de l'appel à cet endpoint.

### Génération locale (sans Mistral)

Un script en ligne de commande permet d'exporter le HTML à partir des données locales :

```bash
cd backend
pnpm run export-html <id_facture> [chemin_sortie]
```

L'endpoint `/api/factures/:id/html` renvoie également ce même HTML sans dépendre d'un service tiers.

#### Lancement rapide sur macOS

Le script `launch_safari.sh` démarre le backend et le frontend puis ouvre par défaut Safari sur l'URL de l'application. Vous pouvez choisir un autre navigateur avec `--browser=Chrome` ou ne pas en ouvrir avec `--no-browser` :

```bash
./launch_safari.sh --browser=Firefox
```

### Migration de la base de données
Un script est fourni pour ajouter les nouveaux champs légaux aux anciennes factures :

```bash
cd backend
node database/migrations/002-add-legal-fields.js
```
Ce script renseigne également le champ `vat_rate` (taux de TVA) à `0` pour les factures qui n'en possèdent pas.

## 📁 Structure du projet

```
Mam-s-Facture/
├── backend/                    # API Node.js/Express
│   ├── database/              # Système de stockage JSON
│   │   ├── storage.js         # Gestionnaire de base de données JSON
│   │   └── data/              # Fichiers de données (auto-créés)
│   │       ├── factures.json  # Données des factures
│   │       └── lignes.json    # Lignes de facturation
│   ├── server.js              # Serveur Express principal
│   └── package.json           # Dépendances backend
├── frontend/                   # Application React
│   ├── src/
│   │   ├── pages/             # Pages principales
│   │   │   ├── Accueil.tsx    # Page d'accueil
│   │   │   ├── ListeFactures.tsx    # Liste et recherche
│   │   │   ├── CreerFacture.tsx     # Création de facture
│   │   │   ├── DetailFacture.tsx    # Détails d'une facture
│   │   │   └── ModifierFacture.tsx  # Modification
│   │   ├── components/        # Composants réutilisables
│   │   └── App.tsx           # Application principale
│   └── package.json          # Dépendances frontend
└── README.md                 # Cette documentation
```

## 🔧 API REST - Endpoints

### Factures
- `GET /api/factures` - Liste des factures avec pagination et filtres
- `GET /api/factures/:id` - Détails d'une facture
- `POST /api/factures` - Créer une nouvelle facture
- `PUT /api/factures/:id` - Modifier une facture
- `DELETE /api/factures/:id` - Supprimer une facture
- `GET /api/factures/:id/html` - Exporter la facture en HTML
- `GET /api/factures/:id/mistral-html` - Exporter la facture en HTML généré par Mistral
- `GET /api/clients` - Liste des clients
- `POST /api/clients` - Créer un client
- `GET /api/clients/:id` - Détails d'un client

### Utilitaires
- `GET /api/health` - État de santé de l'API
- `GET /api/stats` - Statistiques générales

### Paramètres de recherche (GET /api/factures)
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 10)
- `search` : Recherche par nom client, entreprise ou numéro de facture
- `dateDebut` : Filtrer à partir de cette date (format: YYYY-MM-DD)
- `dateFin` : Filtrer jusqu'à cette date (format: YYYY-MM-DD)

## 📊 Utilisation

### Créer une nouvelle facture
1. Cliquer sur "Créer une nouvelle facture" depuis l'accueil
2. Remplir les informations client (nom requis)
3. Ajouter les lignes d'articles/prestations
4. Le montant total se calcule automatiquement
5. Cliquer sur "Créer la facture"

### Gérer les factures
1. Accéder à la liste des factures
2. Utiliser les filtres pour rechercher
3. Cliquer sur les actions : Voir, Modifier, Exporter, Supprimer

### Exporter en HTML
 - Cliquer sur l'icône d'export dans la liste ou sur le bouton
   "Exporter" dans les détails
 - Le fichier HTML peut ensuite être imprimé au format PDF

## 🎨 Fonctionnalités interface

### Formatage français
- **Dates** : Format DD/MM/YYYY partout
- **Devises** : Format français avec € (ex: 1 234,56 €)
- **Nombres** : Séparateurs français (virgule pour les décimales)

### Validation et sécurité
- **Validation côté client** : Formulaires avec contrôles en temps réel
- **Validation côté serveur** : API avec validation des données
- **Gestion d'erreurs** : Messages d'erreur explicites en français
- **Calculs automatiques** : Évite les erreurs de saisie

### Expérience utilisateur
- **Interface intuitive** : Navigation claire et logique
- **Feedback visuel** : Confirmations et messages d'état
- **Responsive design** : Fonctionne sur mobile et desktop
- **Performance** : Chargement rapide avec pagination
- **Thèmes** : Sunset, Système (par défaut) et Dark sélectionnables depuis la barre latérale

## 🛠️ Développement

### Données d'exemple
L'application inclut des données d'exemple pour la démonstration :
- 3 factures pré-créées avec différents clients
- Lignes de facturation variées
- Montants et dates réalistes
- Les factures comportent désormais un titre, des informations légales et un statut payé/non payé

### Personnalisation
- **Informations entreprise** : Modifiables dans `server.js` (section export)
- **Styles** : Interface basée sur Tailwind CSS
- **Stockage** : Facilement extensible vers une base de données

### Tests
- Tester l'API avec un client REST (Postman, curl)
- Interface testable directement dans le navigateur
- Export HTML testable via l'interface
- **Tests automatisés** :
  - Backend : `cd backend && pnpm test`
  - Frontend : `cd frontend && pnpm test`

## ⚡ Production

### Déploiement
1. **Backend** : Déployer le serveur Node.js sur votre hébergeur
2. **Frontend** : Construire avec `pnpm run build` et déployer les fichiers statiques
3. **Configuration** : Ajuster les URLs dans le frontend pour pointer vers votre API

### Sauvegardes
- Les données sont stockées dans `backend/database/data/`
- Sauvegarder ces fichiers JSON pour préserver les données
- Simple restauration par copie des fichiers

## 🆘 Support

### Résolution de problèmes
- **Port déjà utilisé** : Modifier le PORT dans server.js
- **CORS errors** : Vérifier que le backend est démarré
- **Données perdues** : Vérifier les fichiers JSON dans database/data/

### Logs et debugging
- Logs serveur affichés dans la console backend
- Erreurs frontend visibles dans la console du navigateur
- API de santé : GET /api/health pour vérifier l'état

---

## 📄 Licence

Ce projet est fourni à des fins éducatives et de démonstration. Libre d'utilisation et modification.

**Développé avec ❤️ en français pour une utilisation professionnelle**
