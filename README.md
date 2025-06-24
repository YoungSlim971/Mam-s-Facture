diff --git a/README.md b/README.md
index 8d1b612983393f38db689b807e29214e58809767..32c76047b2de5043fe0a5f364c1592b94069e0b3 100644
--- a/README.md
+++ b/README.md
@@ -1,83 +1,112 @@
 # Application de Facturation Complète
 
 Une application web moderne et complète pour la gestion de factures, développée avec React, Node.js, et stockage SQLite (sql.js). Interface entièrement en français avec export HTML imprimable.
 
 Pour une installation simplifiée, lancez `./install.sh` à la racine du projet. Ce script installe toutes les dépendances et construit automatiquement le frontend.
 
 ## 🌟 Fonctionnalités principales
 
--### ✅ Interface utilisateur complète
+### ✅ Interface utilisateur complète
 - **Page d'accueil** avec navigation intuitive et barre latérale
 - **Gestion complète des factures** (CRUD)
 - **Recherche et filtrage** par client, période, montant
 - **Pagination** pour une navigation fluide
 - **Interface responsive** adaptée à tous les écrans
+- **Widgets d'accueil** : citation du jour, image relaxante et statistiques animées
 
 ### ✅ Gestion de factures
 - **Création de factures** avec formulaire interactif
 - **Modification en temps réel** de factures existantes
 - **Calculs automatiques** des montants et totaux
 - **Validation** des données côté client et serveur
 - **Numérotation automatique** des factures
 
 ### ✅ Fonctionnalités avancées
 - **Export HTML** prêt pour impression
 - **Formatage français** des dates (DD/MM/YYYY) et devises (€)
 - **Stockage persistant** via SQLite (sql.js)
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
 
+## ⚡ Démarrage rapide
+
+```bash
+# démarre les serveurs en mode dev
+cd backend && pnpm run dev &
+cd ../frontend && pnpm run dev
+```
+L'interface est accessible sur http://localhost:5173 et l'API sur http://localhost:3001.
+
+```bash
+# build de production
+cd frontend && pnpm run build
+cd ../backend && pnpm run build && pnpm start
+```
+
+### Docker
+```bash
+./build-docker.sh
+./run-docker.sh
+```
+L'application écoute sur http://localhost:3001.
+
+### macOS : ouverture automatique
+Donnez les droits au script puis lancez-le :
+```bash
+chmod +x MAMSFACTUREOPENER.sh
+./MAMSFACTUREOPENER.sh
+```
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
diff --git a/README.md b/README.md
index 8d1b612983393f38db689b807e29214e58809767..32c76047b2de5043fe0a5f364c1592b94069e0b3 100644
--- a/README.md
+++ b/README.md
@@ -119,54 +148,55 @@ Si cette variable n'est pas définie, l'URL par défaut `http://localhost:3001/a
 Exemples :
 
 - **Développement** : créer un fichier `.env` dans `frontend/` contenant
   ```bash
   VITE_API_URL=http://localhost:3001/api
   ```
 
 - **Production** : définir la variable lors du build ou sur votre hébergeur
   ```bash
     VITE_API_URL=https://mon-domaine.com/api pnpm run build
     ```
 
 ### Génération locale
 
 Un script en ligne de commande permet d'exporter le HTML à partir des données locales :
 
 ```bash
 cd backend
 pnpm run export-html <id_facture> [chemin_sortie]
 ```
 
 L'endpoint `/api/factures/:id/html` renvoie également ce même HTML sans dépendre d'un service tiers.
 
 #### Lancement rapide sur macOS
 
-Le script `launch_safari.sh` démarre le backend et le frontend puis ouvre par défaut Safari sur l'URL de l'application. Vous pouvez choisir un autre navigateur avec `--browser=Chrome` ou ne pas en ouvrir avec `--no-browser` :
+Le script `MAMSFACTUREOPENER.sh` installe les dépendances, démarre les deux serveurs et ouvre automatiquement Safari.
 
 ```bash
-./launch_safari.sh --browser=Firefox
+chmod +x MAMSFACTUREOPENER.sh
+./MAMSFACTUREOPENER.sh
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
 │   ├── database/              # Stockage SQLite (sql.js)
 │   │   ├── sqlite.js          # Gestionnaire de base de données SQLite
 │   │   └── facturation.sqlite # Fichier de base de données
 │   ├── server.ts              # Serveur Express principal (compile en dist/server.js)
 │   └── package.json           # Dépendances backend
 ├── frontend/                   # Application React
 │   ├── src/
 │   │   ├── pages/             # Pages principales
 │   │   │   ├── Accueil.tsx    # Page d'accueil
