# Holifresh Sales Challenge - V1

Une application web minimale et performante pour gérer des challenges commerciaux en temps réel.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Langage**: TypeScript
- **Base de données**: SQLite (via Prisma)
- **Styling**: Tailwind CSS (Dark Mode Premium)
- **Polling**: Rafraîchissement automatique toutes les 3-5 secondes

## Installation Locale

1.  **Cloner le projet**
2.  **Installer les dépendances** :
    ```bash
    npm install
    ```
3.  **Configurer les variables d'environnement** :
    Créez un fichier `.env` à la racine :
    ```env
    DATABASE_URL="file:./dev.db"
    ADMIN_CODE="votre_code_secret"
    ```
4.  **Initialiser la base de données** :
    ```bash
    npx prisma migrate dev --name init
    ```
5.  **Lancer le serveur de développement** :
    ```bash
    npm run dev
    ```

## Utilisation

-   **/admin** : Espace administrateur pour créer/ouvrir/fermer des rooms.
-   **/join/[roomCode]** : Lien pour que les sales rejoignent le challenge.
-   **/room/[roomCode]** : Dashboard sales avec le bouton "+1 RDV".
-   **/screen/[roomCode]** : Écran TV haute visibilité avec leaderboard et thermomètre.

## Migration vers Production (PostgreSQL)

Pour déploier sur Vercel avec une base de données persistante :
1.  Remplacez `provider = "sqlite"` par `provider = "postgresql"` dans `prisma/schema.prisma`.
2.  Mettez à jour les variables d'environnement sur Vercel.

## Fonctionnalités V1
- Anti Double Tap (3s de cooldown entre deux clics).
- Idempotence serveur via Request UUID.
- Audit log (Admin can undo / rename).
- Export CSV complet.
- Design premium responsive.
