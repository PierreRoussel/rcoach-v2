# Accès admin plateforme

## 1. Appliquer les migrations Nhost

Déployer les migrations `1743900000000_profile_admin_role` et `1743910000000_admin_platform_kpis`, puis les metadata Hasura (fonction `admin_platform_metrics`).

## 2. Promouvoir un compte admin

Exécuter [`admin-promote-leo.sql`](./admin-promote-leo.sql) dans le SQL Editor Nhost / Hasura (adapter l’UUID si besoin).

## 3. Hook JWT Nhost (recommandé)

Dans le dashboard Nhost :

1. **Settings → Auth → Hooks → Custom access token**
2. Pointer vers la function `auth-access-token` (`functions/auth-access-token/index.ts`)
3. Redéployer les functions si nécessaire

Sans ce hook, les KPI restent protégés par `is_request_admin()` côté SQL (vérifie `profiles.role = 'admin'` via le JWT user id).

## 4. Vérifications manuelles

- Compte non-admin : `/coach/admin` redirige vers `/coach`
- Compte admin : bouton **Dashboard admin** visible sur `/coach`
- GraphQL `admin_platform_metrics` retourne des agrégats
- Compte non-admin appelant la fonction : erreur `forbidden`

## 5. Revenus affichés

Les montants MRR/ARR sont **estimés** à partir des abonnements actifs (`provider: 'none'` tant que Stripe/Play ne sont pas branchés).
