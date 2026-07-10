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
2. L’icône doit s’appeler **RCoach Montre** (même `applicationId` `com.rcoach.app` que le phone — requis pour le Data Layer).
3. Le téléphone doit avoir l’app `com.rcoach.app` installée et être appairé.

**Important — même `applicationId` :** `./gradlew :wear:installDebug` installe sur **tous** les appareils adb connectés. L’APK montre **remplace** l’APK phone sur le téléphone → écran « Ouvrez une séance » sur le phone. Utilisez les scripts ciblés :

```bash
npm run install:android:wear    # montre uniquement
npm run install:android:phone   # téléphone uniquement
npm run install:android:both    # build web + les deux APK aux bons appareils
```

Android Studio : module **`wear`** + **sélectionnez la montre** dans la liste des devices (pas le téléphone).

#### L’écran montre (« Ouvrez une séance ») s’affiche sur le téléphone

L’APK **wear** a été installé sur le téléphone (même `applicationId`). Réinstallez l’APK phone :

```bash
npm run install:android:phone
```

Puis réinstallez la montre séparément :

```bash
npm run install:android:wear
```

#### Erreur « Activity class {com.rcoach.app.wear/...} does not exist »

L’icône ou Android Studio pointe encore vers l’ancien package debug `com.rcoach.app.wear`. Depuis la correction Data Layer, le module `wear` s’installe sous `com.rcoach.app` (activité `com.rcoach.app.wear.MainActivity`).

```bash
# Sur la montre (remplacer <watch> par l’id adb de la montre)
adb -s <watch> uninstall com.rcoach.app.wear
adb -s <watch> uninstall com.rcoach.app
cd android && ./gradlew :wear:installDebug
```

Relancez **RCoach Montre** depuis le tiroir d’apps (pas un ancien raccourci). Dans Android Studio : Run le module **`wear`**, pas une config figée sur `com.rcoach.app.wear`.

#### Erreur « This app requires a WebView »

Vous avez lancé le module **phone** (`app`) sur la montre. Capacitor nécessite une WebView, absente sur Wear OS. Installez le module **`wear`** (Compose natif).

#### « Montre non appairée » sur le téléphone

L’app Wear OS peut afficher « Connecté » sans que l’API **Wearable** voie encore les nœuds (fréquent sur émulateur).

1. Sur la **montre** (émulateur) : **⋯ → Wear OS → Pair with phone** → choisir l’émulateur téléphone.
2. Sur le **téléphone** : app **Wear OS** → montre **Connectée**.
3. Ouvrez **RCoach Montre** sur la montre, puis **RCoach** sur le téléphone.
4. Rebuild obligatoire après changement du plugin :
   ```bash
   npm run build:android
   ```
   Puis Run `app` (téléphone) et Run `wear` (montre).
5. Logcat téléphone : filtre `WearBridge` — vous devez voir `connected=… capability=…` et `Published workout snapshot`.

La pastille indique trois états : connectée, appairée sans RCoach ouvert, ou non appairée.

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
