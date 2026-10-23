# Mooov — projectafspraken

## Stack

- Expo SDK 58, TypeScript (strict), Expo Router (file-based routing in `app/`)
- Supabase (auth + database); sessie in `expo-secure-store` via `src/lib/supabase.ts`
- EAS Build en EAS Submit (`eas.json`: `development`, `preview`, `production`)
- ESLint (`eslint-config-expo`) + Prettier

Appconfiguratie staat in `app.config.ts` (naam, slug `mobile-app`, bundle ID / package `nl.linkandlead.mobileapp`).

## Mappen

- `app/` — routes en layouts (geen andere code)
- `src/components`, `src/lib`, `src/hooks`, `src/constants`, `src/types` — importeren via `@/…`
- `docs/ontwerp/` — visuele overdracht van het Moov-ontwerp (designsysteem, schermspecificaties, prototype). Alleen als bron gebruiken wanneer daar expliciet om gevraagd wordt.

## Commando's

```bash
npx expo install <pakket>   # altijd i.p.v. npm install, voor SDK-compatibele versies
npm run lint                # ESLint
npm run typecheck           # tsc --noEmit
npm run format              # Prettier
```

Draai `lint` en `typecheck` voordat een taak af is.

## Werkafspraken

- Communicatie, code-commentaar, commits en PR-teksten in het Nederlands.
- De UI van de app is Nederlands.
- Werk in fases en stop na elke fase voor akkoord.
- Geen push naar `main` zonder toestemming; werk op een feature-branch.
- Geen secrets in de code. Alleen `EXPO_PUBLIC_`-variabelen voor publieke sleutels (Supabase URL + anon/publishable key); zie `.env.example`. `.env` staat in `.gitignore`.
- RLS staat aan op elke Supabase-tabel, zonder uitzondering.
- Geen code-uitleg tenzij erom gevraagd wordt.
- Breid de scope niet uit buiten de opdracht.

## Checklist voor de stores

- [ ] Privacyverklaring online en URL ingevuld in App Store Connect en Google Play Console
- [ ] Account verwijderen kan in de app zelf (verplicht zodra er accounts zijn), plus een web-URL voor verwijderverzoeken (Google Play)
- [ ] App Store privacylabels (App Privacy) ingevuld
- [ ] Google Play Data safety-formulier ingevuld
- [ ] Screenshots voor alle vereiste formaten (iPhone, iPad indien `supportsTablet`, Android telefoon)
- [ ] Testaccount met inloggegevens voor de reviewers van Apple en Google
- [ ] Definitief icoon en splash (nu placeholders in `assets/`)
- [ ] `version` en `ios.buildNumber` / `android.versionCode` in `app.config.ts` opgehoogd per release
