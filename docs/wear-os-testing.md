# Wear OS — guide de test RCoach

## Distribution (production)

Le module `:wear` est embarqué dans l'AAB phone via `wearApp project(':wear')`.
Les deux modules partagent `applicationId` `com.rcoach.app` et la même signature release.

- **Play Store** : un seul upload (`:app:bundleRelease`) — Google installe la partie montre sur la Wear OS appairée.
- **Companion** : `standalone = false` — la montre nécessite l'app téléphone pour les séances.

Configurer le form factor **Wear OS** dans la Play Console (captures montre + mention dans la fiche).

## Prérequis (dev local)

- Android Studio (SDK 36+)
- JDK 17
- Montre Wear OS appairée via l'app Google **Wear OS** (Bluetooth actif), ou émulateur montre appairé au téléphone

### Build release (phone + montre embarquée)

```bash
npm run build:android
cd android && ./gradlew :app:bundleRelease
```

### Itération rapide sur la montre

Android Studio → Run module `wear` sur l'émulateur ou la montre physique (debug).
Le téléphone doit avoir l'app `com.rcoach.app` installée et appairée.

### Itération sur le téléphone

```bash
npm run build:android
```

Puis Run module `app` sur le téléphone / émulateur phone.

## Scénarios manuels

1. Démarrer une séance depuis un modèle sur le téléphone.
2. Vérifier que la montre affiche le premier exercice.
3. Valider une série depuis la montre (poids/reps).
4. Vérifier la série sur le téléphone et le timer de repos des deux côtés.
5. Passer le repos depuis la montre.
6. Changer d'exercice sur le téléphone et vérifier la mise à jour montre.
7. Terminer la séance sur le téléphone : la montre revient à l'écran Idle.
8. Couper le Bluetooth 10 s pendant le repos : le timer montre continue.

## Tests automatiques

```bash
npm test
```

Couvre le protocole JSON phone/watch (`src/lib/wear/workout-sync-protocol.test.ts`).

## Limites v1

- Sync disponible uniquement via l'APK Android Capacitor, pas via la PWA navigateur.
- La montre ne démarre/termine pas la séance seule.
- Pas de sync cloud directe montre → Nhost.
