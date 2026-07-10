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

1. **Désinstallez** toute app `RCoach` / `com.rcoach.app` déjà présente sur la montre (souvent l’APK phone Capacitor).
2. Android Studio → sélectionnez le module **`wear`** (pas `app`) → Run sur l’émulateur ou la montre physique.
3. L’icône doit s’appeler **RCoach Montre** (`com.rcoach.app.wear` en debug).
4. Le téléphone doit avoir l’app `com.rcoach.app` installée et être appairé.

```bash
cd android && ./gradlew :wear:installDebug
```

#### Erreur « This app requires a WebView »

Vous avez lancé le module **phone** (`app`) sur la montre. Capacitor nécessite une WebView, absente sur Wear OS. Installez le module **`wear`** (Compose natif).

#### « Montre non appairée » sur le téléphone

L’app montre peut fonctionner sans que le téléphone la voie via Google Play Services.

1. Sur le **téléphone** : app **Wear OS** → vérifiez que la montre est **Connectée**.
2. Sur la **montre** : ouvrez **RCoach Montre** et laissez l’app au premier plan.
3. Relancez la séance sur le téléphone.
4. **Émulateurs** : appairez téléphone + montre via l’app Wear OS (Bluetooth actif sur les deux).
5. Rebuild phone après changement du plugin : `npm run build:android` puis Run `app`.

La pastille indique maintenant trois états : connectée, appairée sans RCoach ouvert, ou non appairée.

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
