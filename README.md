# LedgerTrack - Expo + React Native + Docker

## 🚀 Démarrage rapide

### Prérequis

- Docker installé sur votre machine (Docker Desktop recommandé)
- (Optionnel) VS Code pour l'édition

---

## 1. Initialiser le projet (si besoin)

Pour créer un nouveau projet Expo :

Cela crée le dossier `LedgerTrack` et initialise Expo à la dernière version.  
**Si vous avez déjà créé le projet, passez à l’étape suivante.**

---

## 2. Construire l’image Docker

Ou laissez le Makefile s’en charger lors des premières commandes.

---

## 3. Installer les dépendances (si besoin)

Dans le dossier du projet :


---

## 4. Démarrer le serveur Expo (dev mobile)

Dans le dossier du projet :

- Un QR code s’affiche dans le terminal Docker : scannez-le avec Expo Go (Android ou iOS).
- Accès web/devtools sur [http://localhost:19006](http://localhost:19006) si activé.

---

## 5. Ajouter une dépendance (librairie npm)

Exemple pour ajouter la caméra :

Ou créez une commande spécifique dans le Makefile (`make add PACKAGE=expo-camera`).

---

## 6. Lancer un shell interactif dans le conteneur

Pour lancer des commandes personnalisées, debug, manips npm/npx.

---

## 7. Nettoyer l’environnement (volumes/docker/node_modules)

Supprime tous les volumes Docker et purge le cache node_modules, idéal en cas de bug/crash.

---

## 8. (Optionnel) Migrer vers workflow natif (iOS/Android)


---

## 9. Structure du projet

LedgerTrack/
├── app/ # Code source mobile
├── assets/ # Images, fonts, etc.
├── components/ # Composants réutilisables
├── constants/ # Configs/globales
├── hooks/ # Custom hooks React
├── node_modules/ # Dépendances npm
├── package.json
├── app.json # Config Expo
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── README.md


---

## 🔗 Liens utiles

- [Documentations Expo](https://docs.expo.dev/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Expo CLI Best Practice](https://docs.expo.dev/more/expo-cli/)
- [React Native](https://reactnative.dev/)

---

## 💡 Astuces

- Toutes les dépendances, builds, et serveurs tournent **100% dans Docker**, rien n’est installé ni pollué sur votre machine.
- Pas de souci de version Node/Npm ou node_modules, tout est purgé avec `make clean`.
- Compatible Mac, Linux, Windows (via Docker Desktop).

---

**Pour toute manipulation, privilégiez toujours les commandes du Makefile pour rester 100% reproductible et Dockerisé !**
