# RCoach v2

PWA coach / athlete app backed by [Nhost Cloud](https://nhost.io).

## Prerequisites

- Node.js 20+
- Nhost Cloud project (subdomain + region)
- Optional: Nhost CLI for deployments (`npx nhost-cli-preview`)

## Setup

```bash
cp .env.example .env.local
# Edit VITE_NHOST_SUBDOMAIN and VITE_NHOST_REGION

npm install
npm run dev
```

## Nhost backend

Database migrations and Hasura metadata live in [`nhost/`](nhost/).

**Note:** `nhost/config.yaml` (Hasura CLI, `version: 3`) is required for Git deploys. Service config (`nhost.toml`) stays on Nhost Cloud unless you pull it with `nhost config pull`.

Deploy by pushing to the Git branch linked to your Nhost project, or:

```bash
nhost login
nhost deployments new --subdomain <subdomain> --ref HEAD --follow
```

## GraphQL Codegen

```bash
# Set CODEGEN_HASURA_ADMIN_SECRET in .env.local
npm run codegen
```

## Phase 0 scope

- Auth (register / login)
- Shells `/app` (mobile) and `/coach` (desktop)
- Public exercises library via GraphQL
- Postgres schema + Hasura permissions

## Phase 1 scope

- PWA installable (`vite-plugin-pwa`, manifest, service worker network-first GraphQL)
- Routes athlete : `/app/stats`, `/app/profile`, `/app/workouts`, `/app/workout/active`, `/app/import`
- Seance active (Zustand + timer repos + persistance Dexie)
- Import CSV Hevy (PapaParse)
- Statistiques volume hebdomadaire (Recharts)
- File de sync offline Dexie pour les mutations workout

## Design system

All UI tokens, theme switching, and shared layout components are centralized in [`src/design-system/`](src/design-system/).

```tsx
import { ThemeProvider, useTheme, PageHeader, Pill } from '@/design-system'
```

- **Theme entry point:** wrap the app with `ThemeProvider` (already done in `main.tsx`)
- **Switch theme later:** call `setThemeId()` from `useTheme()` after registering a new theme in `src/design-system/themes/`
- **UI primitives:** shadcn components in [`src/components/ui/`](src/components/ui/) styled with Sports Candy tokens from the Figma Make export

## Phase 2 scope

### Athlete — builder de seance

- Catalogue exercices complet (`/app/exercises`) avec filtres muscle/equipement
- Creation d exercices personnels
- Seance active ergonomique : picker, drag & drop, types de serie (normal/warmup/failure)
- Rappel performance seance precedente par exercice
- Suggestions de surcharge progressive adaptees au type d exercice (charge, poids du corps, cardio, tempo)
- Catalogue de seances (`/app/sessions`) : modeles reutilisables (nom + exercices ordonnes), creation sans demarrer
- Historique detaille (`/app/workouts/$id`) avec redirection depuis l ancien index

### Coach ERP

- Role coach/both configurable dans le profil
- Gestion clients (`/coach/clients`) : invitation par email, activation/archivage
- Programmes templates (`/coach/programs`) : jours + exercices cibles
- Analytics (`/coach/analytics`) : volume par client, seances recentes

## Verification

```bash
npm run typecheck
npm run verify:routes   # build + HTTP 200 sur toutes les routes
npm run verify:graphql  # schema Hasura deploye
```
