---
name: orchestrate-feature
description: >-
  Orchestrateur bout-en-bout : sujet → mind (rcoach-mind) → spec si besoin
  (spec-from-prompt) → us-to-mr jusqu’à PR mergeée après review humaine.
  Auto-répond depuis le mind ; questions humaines seulement pour infos vraiment
  nouvelles à capturer, plus Accept+ship et review finale (merge).
  Use for « orchestrate », « ship », « livre cette feature », « de bout en bout
  depuis le mind », « prends ce sujet et va jusqu’à la PR ».
---

# Orchestrate feature — mind → PR mergeée

Chef d’orchestre. Les skills enfants font le travail ; celui-ci **décide**, **résout**, **économise**, et **n’interrompt l’humain que pour du nouveau**.

| Skill | Quand |
|-------|--------|
| `rcoach-mind` | Lire / capturer faits courts |
| `spec-from-prompt` | Créer ou densifier une SPEC (max 1 appel / run) |
| `us-to-mr` | SPEC `accepted` → code → PR → `done` → merge si review humaine OK |

**Mind** : `../rcoach-mind` (`C:/Users/leobr/Documents/dev/rcoach-mind`).  
**État** : `<scratchpad>/orchestrate/<slug>.md` — seule source de reprise.

## Budgets (durs)

| Budget | Plafond | Au-delà |
|--------|---------|---------|
| `spec-from-prompt` | **1** / run | §Arrêts « shrink le sujet » |
| Tour questions humaines | **1** (≤ 4 Q) | pas de 2ᵉ tour ; Arrêt si encore bloquant |
| Explore `quick` | **1** (sauf `[À REFETCH]`) | réutiliser ancres scratchpad |
| Steps `## Plan` | **≤ 7** ; et pas `nhost`+`design_system`+`offline` tous true | **split forcé** (§Split) avant code |
| Densification SPEC | **1** passe | pas de boucle « améliorer la spec » |

## Contrat interactif

Trois cas seulement :

1. **`NEED_HUMAN`** dans la matrice → 1 tour ≤ 4 questions fermées.
2. **Accept+ship** → **obligatoire** si `spec_created_this_run: true` **ou** promotion `draft→accepted` dans ce run. Une question unique : « Accept + ship `<id>` ? » (scope en 3 bullets).  
   Si SPEC déjà `accepted` au bootstrap → **pas** de go cosmétique ; enchaîner §C.
3. **Review humaine finale** (`us-to-mr` §7) → question unique « Review humaine OK ? ». Sur **oui** : **merger** la PR (`gh pr merge --squash --delete-branch`). Sur non : PR ouverte, pas de merge.

Confirmations rule `05` (`nhost` / `design_system`) :
- Déjà `true` sur SPEC **déjà** `accepted` + Plan justifie → `auto_confirm`.
- Spec neuve / draft dans ce run → inclus dans le go « Accept + ship » (pas de 2ᵉ confirmation).

## Économie

- INDEX.md **une fois** ; chemins matchés seulement.
- Subagents : synthèses ≤ 5–10 lignes ; Explore ∥ match mind si besoin.
- Modèle fort : matrice, split, contradictions, accept. Léger : Explore, gates, review §5, PR.
- Capture humaine → mind **avant** suite.

## A. Bootstrap

1. Entrée = sujet / id / « ship \<id\> ».
2. Scratchpad slug ; flags : `spec_created_this_run: false`, `promoted_this_run: false`.
3. `INDEX.md` → match.
4. Classer :

| Hit | Suite |
|-----|--------|
| 1× `accepted` | Matrice légère (STALE_MIND) → **C** si verte |
| 1× `draft` | **B** + go Accept+ship |
| 1× `done` | Arrêt sauf évolution → nouvelle spec |
| plusieurs | Tie keywords ; sinon 1 Q id |
| 0 | **B** + `spec-from-prompt` (compte budget 1) |

Explore `quick` en parallèle si écriture/implémentation prévue.

## B. Résoudre (mind-first)

1. Créer/densifier SPEC si besoin (`spec-from-prompt` ≤ 1) → `spec_created_this_run: true`.
2. Ouvrir SPEC + `depends_on` ok + domain/decisions cités.
3. **§Split** si Plan > 7 steps **ou** (`nhost` ∧ `design_system` ∧ `offline`) :
   - Découper en 2+ specs `depends_on`, MAJ INDEX, garder la 1ʳᵉ shippable dans ce run.
   - Trop large sans découpe claire → Arrêt « shrink ».
4. Matrice (scratchpad + **persistance SPEC**) :

| id | question | source | verdict |
|----|----------|--------|---------|
| Qn | … | `mind:…` / `code:…` / `NEED_HUMAN` / `STALE_MIND` | réponse |

Verdicts :
- mind ou code clair → **auto** (+ cite).
- brief ↔ mind → `NEED_HUMAN`.
- mind `accepted|done` ↔ code Explore contredit → **`STALE_MIND`** : ne pas coder sur le mensonge ; soit MAJ SPEC (1 densification), soit `NEED_HUMAN` arbitrage.
- absent → `NEED_HUMAN`.
- `depends_on` KO → Arrêt.

5. `NEED_HUMAN` → 1 tour ≤ 4 Q → capturer mind/SPEC → lever clarifications.
6. **Persister** la matrice dans la SPEC section `## Resolution` (voir `_schema.md`) **avant** tout §C. Scratchpad = miroir.
7. **Go Accept+ship** si `spec_created_this_run` ou passage vers `accepted` ce run. Sur oui : `status: accepted` + INDEX, `promoted_this_run: true`. Sur non → Arrêt.
8. SPEC déjà `accepted` en entrée : pas de step 7 ; matrice + `## Resolution` suffisent.

## C. Implémenter (`us-to-mr` orchestré)

Préconditions : `accepted` ; matrice sans `NEED_HUMAN`/`STALE_MIND` ouverts ; `## Resolution` à jour ; `answers_resolved: true` ; `auto_confirm` rempli ; go obtenu si requis §B.7.

Exécuter `us-to-mr` mode orchestré (`orchestrated: true`) :
- Pas de re-questions §0 ; lire `## Resolution` comme décisions actées.
- Réutiliser Explore sauf `[À REFETCH]`.
- §5 léger ; §7 → `done` + checklist humaine ; sur « Review humaine OK ? » **oui** → merge PR (délégation `us-to-mr` §7, pas de merge anticipé).
- Resolution peut rester pour historique.

Même chat. Pas de roman.

## D. Multi-specs

Ordre topo `depends_on`. §B lot (≤ 4 Q fusionnées + un Accept+ship par spec **nouvelle**). §C séquentiel 1 PR / id.

## E. Sortie

Toujours terminer par le bloc compact **puis** la checklist humaine (même si arrêt partiel / PR KO / browser partiel) :

```
orchestrate: <slug>
spec: <id> (→ done|accepted|…)
pr: <url>|pending|merged
matrix: auto=N human=M stale=K
split: [ids…] | none
accept_go: skipped|yes
human_review: pending|yes→merged|no
mind: captures […]
browser: ok|partial|skip (<raison>)
```

### `## À tester (humain)` — obligatoire

Checklist **pour le user** (pas pour l’agent) : 3–8 steps concrets (route, action, résultat attendu), issus de la SPEC `## Acceptance` / `## Tests` et de ce que `us-to-mr` §6 a couvert ou laissé.  
Si multi-specs : une sous-liste par `id`.  
Si run arrêté avant code : steps de validation manuelle du cadrage / go Accept uniquement.  
Après « Review humaine OK ? » **oui** → merge via `us-to-mr` §7 ; mettre à jour `pr:` / `human_review:` dans le bloc compact.

```markdown
## À tester (humain)
1. …
```

## Arrêts

- Budgets dépassés / sujet à shrink.
- `STALE_MIND` non tranché.
- Tie INDEX ; `done` sans évolution ; `depends_on` KO.
- Refus Accept+ship ; `NEED_HUMAN` sans réponse.
- Arrêts techniques `us-to-mr`.

Reprise : scratchpad orchestrate uniquement (+ SPEC `## Resolution` si besoin).
