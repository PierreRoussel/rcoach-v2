# Accès admin plateforme

> **Contrainte Nhost :** aucun SQL manuel (pas de SQL Editor Hasura). Tout changement base passe par `nhost/migrations/` puis **déploiement Nhost** (git push / CI).

## 1. Déployer les migrations

Pousser la branche et lancer le workflow **Deploy Nhost** (ou `nhost deploy` en local si configuré).

Migrations requises pour le dashboard admin :

| Migration | Rôle |
|-----------|------|
| `1743900000001_profile_admin_role` | Colonne `profiles.role` |
| `1743910000000_admin_platform_kpis` | Fonctions KPI admin |
| `1744500000000_fix_admin_kpi_functions` | Correctifs KPI |
| `1744600000000_support_requests` | Table support |
| `1744700000000_fix_hasura_jwt_user_id` | Lecture JWT user id |
| `1744710000000_enhance_request_hasura_user_id` | Repli JWT |
| **`1744720000000_fix_admin_jwt_security_invoker`** | **Correctif `forbidden`** (SECURITY INVOKER + regex) |
| **`1744730000000_promote_pierre_admin`** | Promotion admin Pierre Roussel |

Metadata Hasura associées : fonctions `admin_platform_metrics`, `admin_platform_recent_lists`, `admin_support_requests`.

Après deploy : **se déconnecter / reconnecter** dans l’app (nouveau JWT).

## 2. Promouvoir un autre compte admin

Créer une migration dédiée (copier le modèle de `1744730000000_promote_pierre_admin`) :

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<uuid-du-compte>';
```

Commit, push, deploy Nhost. Pas d’alternative SQL manuelle.

## 3. Erreur `forbidden` sur les KPI admin

**Cause :** les migrations `174470`–`174472` ne sont pas encore déployées sur l’environnement distant, ou le compte n’a pas `profiles.role = 'admin'`.

**Solution (deploy uniquement) :**

1. Vérifier que la branche contient `174472` et `174473` (si promotion admin nécessaire).
2. Lancer **Deploy Nhost** et attendre la fin du job.
3. Se reconnecter dans l’app.
4. Retester `/coach/admin`.

La migration **174472** corrige la lecture JWT dans `request_hasura_user_id()` / `is_request_admin()` (GUC `hasura.user`, repli regex, rôle JWT `admin` en secours).

## 4. Hook JWT Nhost (recommandé, pas obligatoire)

1. **Settings → Auth → Hooks → Custom access token**
2. Pointer vers `auth-access-token` (`functions/auth-access-token/index.ts`)
3. Redéployer les functions Nhost
4. Se reconnecter

Sans hook : `is_request_admin()` vérifie `profiles.role = 'admin'` via `x-hasura-user-id` dans le JWT.

Avec hook : le JWT inclut `x-hasura-allowed-roles: [user, admin]` ; l’app envoie `x-hasura-role: admin` sur les requêtes KPI.

## 5. Metadata Hasura (rôle `user` sur les fonctions admin)

Les fonctions admin restent exposées aux rôles **`user`** et **`admin`**. La protection réelle est **`is_request_admin()`** dans chaque fonction SQL.

## 6. Vérifications après deploy

- Compte non-admin : `/coach/admin` redirige vers `/coach`
- Compte admin : bouton **Dashboard admin** sur `/coach`
- GraphQL `admin_platform_metrics` retourne des agrégats
- Onglet **Support** liste les demandes `support_requests`

## 7. Revenus affichés

MRR/ARR **estimés** à partir des abonnements actifs (`provider: 'none'` tant que Stripe/Play ne sont pas branchés).
