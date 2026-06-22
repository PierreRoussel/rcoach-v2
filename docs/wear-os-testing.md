# Wear OS — guide de test RCoach

## Prérequis

- Android Studio (SDK 34+)
- JDK 17
- Emulateur telephone API 34 + emulateur Wear OS Large Round API 34 appaires
- Build phone : `npm run build:android` puis Run sur l emulateur/device
- Build watch : ouvrir le module `android/wear` dans Android Studio et Run sur l emulateur montre

## Scenarios manuels

1. Demarrer une seance depuis un modele sur le telephone.
2. Verifier que la montre affiche le premier exercice.
3. Valider une serie depuis la montre (poids/reps).
4. Verifier la serie sur le telephone et le timer de repos des deux cotes.
5. Passer le repos depuis la montre.
6. Changer d exercice sur le telephone et verifier la mise a jour montre.
7. Terminer la seance sur le telephone : la montre revient a l ecran Idle.
8. Couper le Bluetooth 10 s pendant le repos : le timer montre continue.

## Tests automatiques

```bash
npm test
```

Couvre le protocole JSON phone/watch (`src/lib/wear/workout-sync-protocol.test.ts`).

## Limites v1

- Sync disponible uniquement via l APK Android Capacitor, pas via la PWA navigateur.
- La montre ne demarre/termine pas la seance seule.
- Pas de sync cloud directe montre -> Nhost.
