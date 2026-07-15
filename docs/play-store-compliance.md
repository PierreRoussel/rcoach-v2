# Play Store — conformité RCoach

Checklist pour la soumission Google Play (`com.rcoach.app`).

## URLs à renseigner dans Play Console

| Champ | URL |
|-------|-----|
| Politique de confidentialité | https://rcoach.fr/legal/privacy |
| Suppression de compte | https://rcoach.fr/help (section FAQ + paramètres in-app) |
| Site développeur (optionnel) | https://rcoach.fr |
| Email support | support@rcoach.fr |

## Pages légales in-app / web

- https://rcoach.fr/legal/privacy
- https://rcoach.fr/legal/terms
- https://rcoach.fr/legal/cgv
- https://rcoach.fr/legal/mentions-legales
- https://rcoach.fr/help
- https://rcoach.fr/about

**Prérequis** : déployer le SPA sur `rcoach.fr` (Cloudflare Pages) avec les variables `VITE_LEGAL_*` et `VITE_SUPPORT_EMAIL` renseignées.

## Data Safety (formulaire Play Console)

Déclarer au minimum :

| Type de données | Collecté | Partagé | Finalité |
|-----------------|----------|---------|----------|
| Email, nom affiché | Oui | Non (sauf sous-traitants) | Compte, support |
| Identifiants de session | Oui | Non | Authentification |
| Données fitness (séances, charges, reps) | Oui | Non | Fonctionnalité cœur |
| Données nutrition | Oui | Non | Journal alimentaire |
| Données santé (Health Connect) | Optionnel | Non | Sync séances Android |
| Photos (avatar) | Optionnel | Non | Profil |
| Achats in-app | Oui | Google Play | Abonnement Premium |
| Caméra | Optionnel | Non | Scan code-barres nutrition |

Sous-traitants à mentionner : Nhost (UE), Cloudflare, Google (OAuth, Play, Health Connect), Stripe (web).

## Suppression de compte

- In-app : Profil → Configuration du compte → Supprimer mon compte
- RPC : `delete_my_account()` (supprime `auth.users` + cascade données)
- Délai annoncé : 30 jours max (voir politique de confidentialité)

## Health Connect

URL privacy dans `android/app/src/main/res/values/strings.xml` :

```
https://rcoach.fr/legal/privacy
```

Permissions Android déclarées : `READ_EXERCISE`, `WRITE_EXERCISE`, `READ_HEART_RATE`.

### Play Console (obligatoire pour la beta / prod)

1. Play Console → **Contenu de l'application** → **Santé**
2. Déclarer l'usage de Health Connect (séances d'exercice, fréquence cardiaque en lecture)
3. Lier la politique de confidentialité (`https://rcoach.fr/legal/privacy` doit répondre **200**)

Sans cette déclaration, la demande d'autorisations Health Connect peut échouer silencieusement sur les builds Play Store.

### Appareil

- Android 14+ : Health Connect intégré au système
- Android 13 et moins : installer [Health Connect](https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata) depuis le Play Store
- Après mise à jour de l'APK : Profil → Santé Connect → **Connecter**, ou **Gérer les autorisations**

## Variables d'environnement (production)

```bash
VITE_LEGAL_BASE_URL=https://rcoach.fr
VITE_LEGAL_PUBLISHER_NAME=RCoach
VITE_LEGAL_PUBLISHER_ADDRESS=10 Grand Place, 62760 Pas-en-Artois, France
VITE_LEGAL_SIREN=917869810
VITE_LEGAL_SIRET=91786981000015
VITE_LEGAL_VAT_NUMBER=FR20917869810
VITE_SUPPORT_EMAIL=support@rcoach.fr
```

Les valeurs ci-dessus sont aussi définies par défaut dans `src/lib/legal/config.ts` (surchargeables via `.env` en production).

## Signature release Android

### Principe (Play App Signing)

Google Play gère deux clés :

1. **Clé d’upload** (keystore local) — sert uniquement à signer l’AAB que vous uploadez.
2. **Clé de signature d’application** (Google) — signe l’APK distribué aux utilisateurs. Google peut la réinitialiser si la clé d’upload est perdue (avec conditions).

Activez **Play App Signing** lors de la première soumission d’un AAB dans la [Play Console](https://play.google.com/console) → votre app → **Configuration** → **Intégrité de l’application** → **Signature d’application**.

### 1. Créer le keystore d’upload (une seule fois)

Depuis la racine du dépôt, avec Java/keytool installé :

```bash
keytool -genkeypair -v \
  -keystore android/app/upload-keystore.jks \
  -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storetype JKS
```

Répondez aux questions (nom, organisation, etc.). **Conservez le fichier `.jks` et les mots de passe** dans un coffre (1Password, Bitwarden, etc.) — une perte sans Play App Signing est irréversible.

### 2. Configurer Gradle

```bash
cp android/keystore.properties.example android/keystore.properties
```

Éditez `android/keystore.properties` avec vos vrais mots de passe. Ce fichier est ignoré par git.

`android/app/build.gradle` et `android/wear/build.gradle` chargent `signingConfigs.release` via `android/signing.gradle` si `keystore.properties` existe.

### 3. Builder l’AAB release

L’AAB embarque le module Wear OS (`wearApp project(':wear')`). Même `applicationId` et signature sur phone et montre.

```bash
npm run build:web
npx cap sync android
cd android && ./gradlew :app:bundleRelease
```

L’AAB se trouve dans `android/app/build/outputs/bundle/release/app-release.aab` (phone + montre).

### 4. Première upload Play Console

1. Créer l’application dans la Play Console (`com.rcoach.app`).
2. **Configuration avancée** → **Facteurs de forme** → ajouter **Wear OS** (captures montre + mention « Wear OS » dans la fiche).
3. **Production** ou **Tests internes** → **Créer une version** → uploader `app-release.aab`.
4. Accepter **Play App Signing** quand Google le propose.
5. Télécharger et archiver l’**empreinte SHA-1/SHA-256** de la clé d’upload (utile pour OAuth, Firebase, etc.) :

```bash
keytool -list -v -keystore android/app/upload-keystore.jks -alias upload
```

### CI (optionnel)

En pipeline, ne pas committer le keystore : injecter `keystore.properties` et le fichier `.jks` via secrets (base64), ou utiliser les variables d’environnement Gradle :

```properties
storePassword=${UPLOAD_STORE_PASSWORD}
keyPassword=${UPLOAD_KEY_PASSWORD}
```

(Gradle résout `${…}` depuis l’environnement si configuré.)

## Hors scope dépôt (manuel)

- Fiche store (titre, descriptions FR, screenshots, feature graphic)
- Questionnaire classification du contenu
- Data Safety : validation finale dans la console
- Revue juridique des textes CGU / CGV / confidentialité

## Vérifications locales

```bash
npm run verify:routes
npm run build
```

Tester les routes `/legal/*` et `/help` en preview Cloudflare avant soumission.
