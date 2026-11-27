---
name: spec-from-prompt
description: >-
  Rédige une spécification fonctionnelle+technique agent-first dans rcoach-mind
  (sibling) à partir d’un prompt simple : SPEC.md dense, INDEX, liens
  depends_on/related. Use for « rédige une spec », « spec-from-prompt »,
  « plan d’implémentation dans le mind », « documente cette feature dans
  rcoach-mind ».
---

# Spec from prompt → rcoach-mind

Produit une spec **exploitable par agents** (pas une doc humaine) dans le second cerveau sibling.

**Chemin mind** : `../rcoach-mind` depuis la racine `rcoach-v2`  
(absolu typique : `C:/Users/leobr/Documents/dev/rcoach-mind`)

Lire une fois : `AGENTS.md` + `_schema.md` + `INDEX.md`. Template : `_templates/spec.md`.  
Rule associée : `06-rcoach-mind`. Faits courts sans plan → skill `rcoach-mind`.  
Appel typique depuis `orchestrate-feature` phase B (sujet sans SPEC `accepted`).

## 0. Entrée

Prompt utilisateur = besoin. Optionnel : issue `#N`, clés domaine, contraintes.

Slug `id` : `kebab-case` stable (domaine-préfixe si utile, ex. `nutrition-barcode-cache`).

## 1. Matching cerveau (avant d’écrire)

1. Lire `INDEX.md` uniquement.
2. Match `keywords` / `domain` / titre vs prompt.
3. Ouvrir les `SPEC.md` / `decisions/` matchés + leurs `depends_on` (`accepted|done`).
4. Si collision / extension d’une spec existante → **mettre à jour** celle-ci (pas de doublon). Demander confirmation si `status: accepted|done`.

## 2. Ancrage code (subagent Explore `quick`)

Sur `rcoach-v2` : routes, `src/lib/<domain>/`, hooks, ops GraphQL, design-system, `nhost/` si pertinent.  
Retour max : liste `fichier:ligne` + 5 lignes. Alimente `touches` + `## Plan`.

## 3. Clarifications (1 tour, ≤ 4 questions)

Uniquement si `[À CLARIFIER]` bloquant (scope, nhost, design-system, rôle). Sinon rédiger en `status: draft` avec les `[À CLARIFIER: …]` dans Acceptance/Constraints.

## 4. Écriture

Créer `specs/<id>/SPEC.md` en respectant **titres et frontmatter** de `_schema.md` (ordre des sections imposé).

Règles densité :
- Zéro prose narrative. Bullets. Chemins réels.
- `## Plan` : steps `files:` / `do:` / `check:` ; **≤ 7 steps** — sinon proposer split (`depends_on`) plutôt qu’un pavé (orchestrateur refuse nhost∧DS∧offline sur une seule spec).
- Flags `nhost` / `design_system` / `offline` honnêtes.
- `## Resolution` : placeholder `(rempli par orchestrate-feature…)` si draft.
- `## Links` = miroir relatif des ids frontmatter.

Puis :
1. Entrée YAML dans `INDEX.md` (`specs:`).
2. Liens inverses : pour chaque `related` / `depends_on`, ajouter cet `id` dans le frontmatter (+ `## Links`) de la cible si absent.
3. Si invariants stables nouveaux → `domains/<domain>.md` (court) ou MAJ ; sinon ne pas créer.
4. ADR transverse durable → `decisions/<id>.md` + entrée `decisions:` dans INDEX ; lier depuis la spec.

## 5. Sortie chat (courte)

```
id: <id>
status: draft|accepted
path: ../rcoach-mind/specs/<id>/SPEC.md
related: …
depends_on: …
nhost/ds/offline: …
next: orchestrate-feature (Accept+ship) ou status → accepted puis us-to-mr <id>
```

Ne pas implémenter le code sauf demande explicite. `us-to-mr` refuse tout statut autre que `accepted` (pas de JIRA / issue comme spec).

## Anti-patterns

- Spec hors `rcoach-mind` (pas dans le repo code).
- Dupliquer une entrée INDEX.
- Oublier les liens inverses.
- Charger tout le mind dans le contexte.
- Inventer tables/ops GraphQL : `[À CLARIFIER]` ou ancrage Explore.
