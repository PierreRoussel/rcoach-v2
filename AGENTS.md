# RCoach v2 — Guide agents IA

Ce dépôt utilise des **Cursor rules** dans [`.cursor/rules/`](.cursor/rules/). Elles s'appliquent automatiquement selon le contexte.

## Rules

| Fichier | Portée | Contenu |
|---------|--------|---------|
| `00-rcoach-stack.mdc` | **Toujours** | Stack, versions lockfile, commandes |
| `10-rcoach-architecture.mdc` | `src/**` | Dossiers, état, anti-patterns |
| `15-rcoach-dry.mdc` | `src/**` | Chercher avant d'ajouter, extraire, anti-duplication |
| `20-rcoach-graphql-nhost.mdc` | GraphQL, nutrition, workout, db, hooks, `nhost/` | Requêtes, migrations, offline |
| `30-rcoach-react-routing-ui.mdc` | Routes, components, hooks, design-system | Router, UI, français |
| `35-rcoach-design-system.mdc` | Routes, components, design-system | Tokens, Pill, PageHeader, patterns carte |
| `40-rcoach-auth.mdc` | Auth | Nhost, PKCE, OAuth Google |
| `50-rcoach-capacitor-pwa-android.mdc` | PWA, Android, bridges | Capacitor 8, plugins |
| `60-rcoach-nutrition-offline.mdc` | Nutrition, diet | Cache Dexie, sync queue, policy |
| `61-rcoach-workout-active.mdc` | Séance active | Zustand, circuit, Dexie draft |
| `70-rcoach-coach.mdc` | `/coach` | ERP, rôles, layout |
| `80-rcoach-tests.mdc` | `*.test.ts` | Vitest, périmètre |

## Démarrage rapide

```bash
cp .env.example .env.local   # VITE_NHOST_SUBDOMAIN, VITE_NHOST_REGION
npm install && npm run dev
```

## Vérifications

```bash
npm run typecheck && npm run lint && npm test
npm run verify:graphql   # après schema Hasura
npm run verify:routes    # après nouvelles routes
```

Documentation produit : [README.md](README.md).
