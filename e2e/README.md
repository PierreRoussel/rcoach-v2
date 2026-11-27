# E2E visuels (Playwright)

Suite UI + `toHaveScreenshot`. Vitest reste pour la logique pure (`src/**/*.test.ts`).

## Commandes

```bash
npm run test:e2e          # run + compare baselines
npm run test:e2e:update   # régénère les snapshots
```

Baselines versionnés sous `e2e/**/*-snapshots/`. Générés sur la machine locale (pas de CI v1).

## Auth

Specs athlète : fichier gitignored `.local/test-account.md` (Email / Mot de passe).  
Absent → skip propre des specs auth ; seed public reste vert.

## Quand ajouter un scénario

Feature avec Acceptance UX / routes → `e2e/<domaine>/*.spec.ts` + baseline, sauf Non-goals explicites dans la SPEC.
