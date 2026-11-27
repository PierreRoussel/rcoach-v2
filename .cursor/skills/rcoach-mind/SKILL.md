---
name: rcoach-mind
description: >-
  Consulter et capturer des faits courts dans rcoach-mind (INDEX, domains,
  decisions). Use when doubt about a feature, business rule, or past decision ;
  or when the human clarifies something to persist. Triggers: « check mind »,
  « documente ça », « c’est quoi la règle pour… ». For full implementation
  specs from a prompt, use spec-from-prompt instead.
---

# rcoach-mind — consulter & capturer

**Racine** : `C:/Users/leobr/Documents/dev/rcoach-mind` (sibling `../rcoach-mind`).  
Rule : `06-rcoach-mind`. Specs complètes → skill `spec-from-prompt`.

## 1. Consulter

1. Lire `INDEX.md` seul.
2. Matcher `keywords` / `domain` / titres.
3. Ouvrir uniquement les chemins matchés (`specs/`, `domains/`, `decisions/`).
4. Répondre en citant `rcoach-mind/...`. Contradictions → arbitrage humain puis corriger.

## 2. Demander si absent

Questions courtes (statut, règle cas X, option retenue). Ne pas enchaîner le dev sur une hypothèse métier non validée.

## 3. Capturer (immédiat)

| Nature | Cible |
|--------|--------|
| Feature / plan multi-fichiers | **Déléguer** à `spec-from-prompt` |
| Invariant métier | `domains/<domain>.md` (créer ou MAJ) |
| Choix durable | `decisions/<id>.md` + entrée `decisions:` dans INDEX |

Toujours rafraîchir `INDEX.md` si nouvelle décision. Liens `related` si une spec cite la décision.

Pas de secrets. Pas de pavé de code. Clarification humaine non capturée = tâche incomplète.

## 4. Avec `orchestrate-feature` / `us-to-mr`

- Orchestrateur : remplir la matrice de résolution depuis INDEX/SPEC/domains ; `NEED_HUMAN` seulement si absent.
- Toute réponse humaine → capturer **ici** (ou SPEC) avant reprise §C / §1.
