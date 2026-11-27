---
name: us-to-mr
description: >-
  Implémente une SPEC accepted de rcoach-mind jusqu’à une PR GitHub mergeée :
  cadrage, gates (typecheck/lint/test/build), rebase, PR, boucle review (max 3),
  test navigateur, SPEC → done, puis merge après review humaine OK. Pas de JIRA.
  Use for « us-to-mr », « us-to-pr », « implémente la spec <id> »,
  « fais la SPEC accepted de bout en bout ».
---

# SPEC (rcoach-mind) → PR GitHub

**Source de vérité unique** : `../rcoach-mind` (`C:/Users/leobr/Documents/dev/rcoach-mind`).  
Pas de JIRA. Pas d’issue GitHub comme spec. Un brief chat **n’est pas** une spec : passer par `spec-from-prompt` puis faire accepter (`status: accepted`) avant ce skill.

Contrat mind : `AGENTS.md` + `_schema.md` + rule `06-rcoach-mind`.

**Contrat d’exécution** : un seul moment interactif (§0). Le « oui » du §0 autorise édition code, branche, commit, push, PR, test navigateur, et MAJ mind (`done` en clôture). Les autres rules `.cursor/rules` restent actives. Ensuite : plus de questions sauf §Arrêts et la **review humaine finale** (§7) dont le « oui » autorise le merge.

**Mode orchestré** (`orchestrate-feature`) : si `orchestrated: true` + `answers_resolved: true`, §0 **sans questions**. Lire `## Resolution` de la SPEC comme décisions actées (avec la matrice parent). `auto_confirm` pour nhost/DS. Enchaîner §1 après scratchpad us-to-mr.

**Économie de tokens** :
- État durable : `<scratchpad>/us-to-mr/<id>.md` — le relire, ne pas recharger tout le mind.
- Après « oui » : enchaîner §1 dans le **même** chat.
- Explore / reviews → synthèses courtes. Gates → **erreurs seulement**.
- Modèle fort : §0 + correctifs ambigus. §5 review → modèle léger, jamais le plus lourd.

**Branches** : `<défaut>` via `git symbolic-ref --short refs/remotes/origin/HEAD` (sans `origin/`), sinon HEAD de `git remote show origin` — jamais `main` en dur. `<base>` = `<défaut>` (ou branche d’une SPEC précédente si dépendance).

Plusieurs specs → §0 groupé, puis §1–§7 **une spec à la fois** (1 branche + 1 PR par id).

## Entrée

Résoudre **un** `id` kebab-case :

1. Fourni explicitement (`us-to-mr nutrition-barcode-cache`) → cet id.
2. Sinon lire `INDEX.md`, matcher `keywords` / `domain` / titre sur le message → un seul candidat `status: accepted` ; plusieurs → demander lequel ; zéro → §Arrêts (créer via `spec-from-prompt`).

**Garde-fous statut** (avant tout code) :

| status | Action |
|--------|--------|
| `accepted` | OK — seule valeur autorisée pour implémenter |
| `draft` | §Arrêts : proposer revue + passage à `accepted` (humain) |
| `done` | §Arrêts : déjà livré ; nouvelle évolution = nouvelle spec / MAJ + `accepted` |
| `deprecated` | §Arrêts |

Prérequis : chaque `depends_on` doit être `accepted` ou `done` dans INDEX ; sinon §Arrêts.

## Mode `full` vs `lite`

Noter dans le scratchpad. Déduit du frontmatter SPEC + taille du Plan :

**`lite`** si **tout** est vrai : ≤ 2 steps dans `## Plan` ; `nhost: false` ; `design_system: false` ; pas de `[À CLARIFIER]` restant.

**`full`** sinon.

| Étape | `lite` | `full` |
| --- | --- | --- |
| §0 Explore code | `quick`, ≤ 5 lignes | idem |
| §5 Review | 1 passe légère (Plan × rules, diff) | subagent review, **max 3** tours |
| §6 Browser | scénarios `## Tests` critiques | tous les Given/When/Then de `## Tests` |

## 0. Cadrage (seul point interactif)

En parallèle :

1. **Mind** (contrat navigation) :
   - `INDEX.md` seul d’abord.
   - Ouvrir `specs/<id>/SPEC.md`.
   - Ouvrir `depends_on` (`accepted|done`) + `decisions/` cités + `domains/<domain>.md` si le fichier existe.
   - **Ne pas** charger le reste du mind.
2. **Explore** `quick` sur `origin/<défaut>` (`git fetch` d’abord) ancré sur `touches` + `## Plan` : existence des chemins, helpers réutilisables. Retour : `fichier:ligne` + ≤ 5 lignes.

Construire le scratchpad **depuis la SPEC** (pas depuis un ticket) :

- `id`, `title`, `mode`, flags (`nhost`, `design_system`, `offline`, `roles`)
- **Checklist** = cases `## Acceptance` (source : `mind:<id>`)
- **Plan** = steps `## Plan` (`files` / `do` / `check`)
- **Edge-cases** = `## Edge-cases`
- **Tests** = `## Tests` (runnable + scénarios)
- **Correspondance critère → code** : pour chaque Acceptance, ancre `fichier:ligne` (Explore + `touches`). Introuvable ou nature différente → `[À CLARIFIER]`
- Tout `[À CLARIFIER]` encore présent dans la SPEC → à trancher ici
- Branche : `feat/<id>` ou `fix/<id>` selon Intent

Si `orchestrated: true` + `answers_resolved: true` : **skip** questions et « oui » ; appliquer `auto_confirm` ; clarifications déjà dans la SPEC ; enchaîner §1 (auth browser : noter besoin dans scratchpad, ne bloquer que si login requis sans compte connu).

Sinon — questions (1 tour, ≤ 4) **uniquement** si besoin :

- chaque `[À CLARIFIER]` ;
- `design_system: true` / `nhost: true` → confirmation dédiée (rule `05`) ;
- Figma manquant si `## UX` le exige ;
- validation plan + branche + mode.

Sinon : demander seulement le « oui » go.

Après « oui » (ou skip orchestré) :

1. Répercuter les clarifications **dans la SPEC** (et INDEX si besoin) via skill `rcoach-mind` / édition SPEC — **avant** §1. Zéro `[À CLARIFIER]` bloquant restant.
2. Auth browser si tests UI : lire `.local/test-account.md` si présent (sans re-demander) ; sinon compte local §0. Jamais prod.
3. Enchaîner §1 immédiatement.

## 1. Démarrage

- Relire **uniquement** le scratchpad (+ SPEC si `[À REFETCH]`).
- `git fetch origin && git switch -c <branche> origin/<base>`. Arbre sale → §Arrêts.

## 2. Développement

- Suivre `## Plan` step par step (Ponytail + rules RCoach). Écarts → scratchpad seulement, pas de narration.
- Bug / repro : si Intent = correctif, reproduire d’abord (§6) ; non reproductible → §Arrêts.
- Runnable de `## Tests` : l’écrire avant le fix s’il s’agit d’un bug ; il échoue puis passe.
- Cocher chaque Acceptance dans le scratchpad avec `fichier:ligne` au fur et à mesure.

## 3. Gate locale

Logs filtrés (erreurs + exit code seulement) :

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

- Acceptance UX / routes ou fichiers `e2e/` touchés → `npm run test:e2e` (gate locale ; pas de CI v1)
- `nhost: true` ou schema touché → `npm run verify:graphql`
- nouvelle route → `npm run verify:routes`

Corriger jusqu’au vert. Échec déjà sur `<base>` hors diff → noter dans scratchpad + body PR, ne pas bloquer.

## 4. Rebase, commit, push, PR

- `git fetch origin && git rebase origin/<base>` avant premier push ; conflit → résoudre + §3.
- Cohérence `git diff --name-only origin/<base>...HEAD` ↔ Acceptance / Plan ; hors périmètre de mon fait → retirer.
- Commit : `feat: <id> - <title>` ou `fix: <id> - …` (pas de mention d’IA / `Co-Authored-By`).
- `git push -u origin <branche>`.
- `gh pr create` — base `<base>`, titre = commit, body =
  - lien mind : `../rcoach-mind/specs/<id>/SPEC.md` (chemin repo sibling / id)
  - Intent (bullets)
  - checklist Acceptance
  - flags nhost / design_system / offline  
  Noter le n° PR dans le scratchpad.

## 5. Boucle review (max 3)

### `full`

1. Subagent **neuf**, modèle **léger** : « Diff branche vs `origin/<base>` contre rules RCoach + SPEC `mind:<id>` (Acceptance/Plan/Constraints). Code ajouté/modifié seulement. Sortie : À corriger numéroté (fichier/symbole/fix) ou `AUCUN RETOUR`. »
2. `AUCUN RETOUR` → §6.
3. Sinon : tout corriger, §3, commit `fix: <id> - retours de review`, push. Retour faux (contredit SPEC ou rule) → ne pas corriger ; noter scratchpad + body PR ; ignoré aux tours suivants.
4. Tour 3 encore sale → §Arrêts.

### `lite`

Une passe dans le chat : diff × Plan × rules. Corriger + §3 si besoin. Doute nhost / design-system / sécu → 1 passe subagent (compte dans les 3).

## 6. Test navigateur

- Si `e2e/**/*.spec.ts` couvre les Acceptance UX de la SPEC : `npm run test:e2e` peut remplacer le parcours manuel pour ces scénarios (baselines = preuve visuelle). Sinon parcours manuel ci-dessous.
- `npm run dev` (Vite **5173**). Serveur déjà là → le réutiliser.
- Auth locale : si `.local/test-account.md` existe → **utiliser sans demander** (email/password du fichier). Sinon autorisation §0 ; sinon §Arrêts.
- Dérouler `## Tests` (`lite` : critiques) + Acceptance UI touchées. Snapshot/DOM > screenshots intermédiaires. Console + réseau 4xx/5xx. Ne pas détruire de données.
- Échec → fix, §3, re-tour §5 (compteur reset pour ce delta), retester.
- 1 screenshot final par écran touché (sauf si déjà couvert par Playwright snapshot).

## 7. Clôture

- Si `origin/<base>` a avancé : rebase, §3, `git push --force-with-lease`.
- `gh pr view` : pas de conflit.
- **Mind (obligatoire)** :
  1. SPEC : `status: done`, `updated: YYYY-MM-DD` ; cocher `- [x]` les Acceptance livrés.
  2. `INDEX.md` : même `status: done` pour cet id.
  3. Invariants nouveaux → `domains/` via skill `rcoach-mind` si besoin.
- Sortie courte :
  1. PR + branche + mode + gates + tours review
  2. Acceptance ✅ (`fichier:ligne`)
  3. Écarts non corrigés / browser agent
  4. `mind: specs/<id>/SPEC.md` → `done`
  5. **`## À tester (humain)` — obligatoire** : checklist actionnable pour le user (routes, données, gestes, résultat attendu). Dérivée de `## Acceptance` + `## Tests` + ce qui a été couvert/non couvert en §6. Format :

```markdown
## À tester (humain)
1. …
2. …
```

- **Review humaine finale** — question unique : « Review humaine OK ? » (après la checklist).
  - **oui** → merger la PR immédiatement :
    1. `gh pr view --json mergeable,state,url,number` : `state=OPEN`, `mergeable=MERGEABLE` (sinon §Arrêts, PR laissée ouverte).
    2. `gh pr merge <n> --squash --delete-branch` (base = `<base>` du §4).
    3. Confirmer : `merged: <url>` + branche locale `git switch <défaut> && git pull`.
    4. Scratchpad : `pr: merged #<n>`.
  - **non** / retours → **ne pas** merger ; noter le feedback scratchpad + commentaire PR si utile ; rouvrir §2–§6 si correctifs nécessaires.
  - Pas de « oui » → ne pas merger (attente).

## Arrêts

- Pas d’id / pas de match INDEX / spec absente → orienter `spec-from-prompt`
- `status` ≠ `accepted`
- `depends_on` non `accepted|done`
- Arbre git sale
- Auth GitHub (`gh`) KO
- Session browser sans compte : pas de `.local/test-account.md` et pas d’autorisation §0
- `design_system` / `nhost` non confirmés alors que flag true
- Bug non reproductible
- 3 tours review sans convergence
- Contradiction découverte vs SPEC en cours de dev
- Merge KO après review humaine oui (`mergeable` ≠ `MERGEABLE`, checks bloquants, `gh pr merge` échec)

Message court + scratchpad à jour pour reprise.
