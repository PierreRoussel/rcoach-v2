# Accès admin plateforme

> **Contrainte Nhost :** aucun SQL manuel. Tout passe par migrations + **Deploy Nhost**.

## Principe

| Étape | Vérification |
|-------|----------------|
| Accès page `/coach/admin` | `profiles.role = 'admin'` (GraphQL client) |
| Données KPI (métriques, listes, support) | Nhost function **`admin-kpi`** : lit `profiles.role` avec le JWT utilisateur, puis appelle le SQL via **admin secret** |

Plus de lecture JWT fragile dans Postgres. Plus de header `x-hasura-role: admin` côté client.

## Déploiement

1. Push + workflow **Deploy Nhost** (migrations + metadata + functions).
2. Migrations clés :
   - `1744730000000_promote_pierre_admin` — promotion admin
   - **`1744740000000_admin_kpi_via_function`** — auth KPI via function Nhost
3. Se reconnecter dans l’app.
4. Ouvrir `/coach/admin`.

## Promouvoir un admin

Nouvelle migration :

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid>';
```

Commit → push → Deploy Nhost.

## Dépannage

| Symptôme | Cause probable |
|----------|----------------|
| Redirection `/coach` | `profiles.role` ≠ `admin` ou migration promotion non déployée |
| « Accès admin requis » | Même chose — le profil chargé n’est pas admin |
| « Configuration Nhost Functions indisponible » | Variables `VITE_NHOST_SUBDOMAIN` / `VITE_NHOST_REGION` manquantes |
| Erreur 500 sur admin-kpi | Function non déployée ou `CODEGEN_HASURA_ADMIN_SECRET` absent côté Nhost |

## Revenus affichés

MRR/ARR estimés (`provider: 'none'` tant que Stripe/Play ne sont pas branchés).
