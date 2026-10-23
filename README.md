# Mooov

Mobiele app voor iOS en Android, gebouwd met Expo, Expo Router en Supabase.

## Vereisten

- Node.js 20 of hoger en npm
- Expo-account (voor EAS)
- De Expo Go-app op je telefoon (App Store / Google Play)

## Lokaal starten

```bash
git clone https://github.com/Hylke75/mobile-app.git
cd mobile-app
npm install
cp .env.example .env   # vul EXPO_PUBLIC_SUPABASE_URL en EXPO_PUBLIC_SUPABASE_ANON_KEY in
npx expo start
```

Controleren: `npm run lint` en `npm run typecheck`.

## Testen in Expo Go

1. Zorg dat je telefoon en computer op hetzelfde wifi-netwerk zitten.
2. Start `npx expo start`.
3. Scan de QR-code: op iOS met de Camera-app, op Android vanuit Expo Go.

Werkt het netwerk niet, gebruik dan `npx expo start --tunnel`.

Expo Go bevat alleen de standaardmodules van Expo. Zodra er een bibliotheek met eigen native code nodig is, test je met een development build (zie hieronder).

## Builden via EAS

Eenmalig: `npx eas-cli@latest login`.

| Profiel       | Doel                                 | Commando                                                        |
| ------------- | ------------------------------------ | --------------------------------------------------------------- |
| `development` | Development build met dev-client     | `npx eas-cli@latest build --profile development --platform all` |
| `preview`     | Interne testversie (Android als APK) | `npx eas-cli@latest build --profile preview --platform all`     |
| `production`  | Versie voor de stores                | `npx eas-cli@latest build --profile production --platform all`  |

Voor interne iOS-builds moet je testtoestel geregistreerd zijn: `npx eas-cli@latest device:create`.

De omgevingsvariabelen uit `.env` worden niet automatisch meegenomen naar EAS. Zet ze in het Expo-dashboard (Project → Environment variables) of via `npx eas-cli@latest env:create`.

## Indienen via EAS Submit

```bash
npx eas-cli@latest submit --platform ios --latest
npx eas-cli@latest submit --platform android --latest
```

- iOS: vereist een Apple Developer-account. EAS vraagt bij de eerste keer om je Apple ID en maakt de app in App Store Connect aan als die nog niet bestaat.
- Android: vereist een Google Play Developer-account en een serviceaccount-sleutel (JSON). De allereerste upload van een Android-app moet handmatig in de Play Console.

Zie `CLAUDE.md` voor de checklist voor de stores.
