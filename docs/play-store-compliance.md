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

## Variables d'environnement (production)

```bash
VITE_LEGAL_BASE_URL=https://rcoach.fr
VITE_LEGAL_PUBLISHER_NAME=...
VITE_LEGAL_PUBLISHER_ADDRESS=...
VITE_LEGAL_SIRET=...
VITE_SUPPORT_EMAIL=support@rcoach.fr
```

Remplacer les placeholders **avant** publication.

## Hors scope dépôt (manuel)

- Keystore release + `signingConfig` Gradle
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
