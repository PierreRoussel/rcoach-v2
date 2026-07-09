# Accès admin plateforme

## 1. Appliquer les migrations Nhost

Déployer les migrations `1743900000001_profile_admin_role`, `1743910000000_admin_platform_kpis`, `1744500000000_fix_admin_kpi_functions`, `1744600000000_support_requests`, puis les metadata Hasura (fonctions `admin_platform_metrics`, `admin_platform_recent_lists`, `admin_support_requests`).

## 2. Promouvoir un compte admin

Exécuter [`admin-promote-leo.sql`](./admin-promote-leo.sql) dans le SQL Editor Nhost / Hasura (adapter l’UUID si besoin).

Vérifier :

```sql
SELECT id, display_name, role FROM public.profiles WHERE role = 'admin';
```

## 2b. Migrations JWT obligatoires pour le dashboard admin

Sans `request_hasura_user_id()` / `is_request_admin()` corrigées → `forbidden` même si `profiles.role = admin` :

- `1744500000000_fix_admin_kpi_functions`
- `1744700000000_fix_hasura_jwt_user_id`
- `1744710000000_enhance_request_hasura_user_id`

**Correctif immédiat** (sans attendre le deploy) : exécuter [`hotfix-admin-jwt.sql`](../scripts/hotfix-admin-jwt.sql) dans Hasura → Data → SQL.

Contrôle des migrations appliquées :

```sql
SELECT version FROM hdb_catalog.schema_migrations ORDER BY version DESC LIMIT 10;
```

## 3. Hook JWT Nhost (optionnel)

Dans le dashboard Nhost :

1. **Settings → Auth → Hooks → Custom access token**
2. Pointer vers la function `auth-access-token` (`functions/auth-access-token/index.ts`)
3. Redéployer les functions si nécessaire

Sans ce hook, les KPI restent protégés par `is_request_admin()` côté SQL (vérifie `profiles.role = 'admin'` via le JWT user id).

## 4. Vérifications manuelles

- Compte non-admin : `/coach/admin` redirige vers `/coach`
- Compte admin : bouton **Dashboard admin** visible sur `/coach`
- GraphQL `admin_platform_metrics` retourne des agrégats
- Onglet **Support** (`/coach/admin?tab=support`) liste les demandes `support_requests`
- Compte non-admin appelant une fonction admin : erreur `forbidden`

## 5. Revenus affichés

Les montants MRR/ARR sont **estimés** à partir des abonnements actifs (`provider: 'none'` tant que Stripe/Play ne sont pas branchés).
