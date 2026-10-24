# Mooove — projectafspraken

## Stack

- Expo SDK 58, TypeScript (strict), Expo Router (file-based routing in `app/`)
- Supabase (auth + database); sessie in `expo-secure-store` via `src/lib/supabase.ts`
- EAS Build en EAS Submit (`eas.json`: `development`, `preview`, `production`)
- ESLint (`eslint-config-expo`) + Prettier

Appconfiguratie staat in `app.config.ts` (naam, slug `mobile-app`, bundle ID / package `nl.linkandlead.mobileapp`).

## Mappen

- `app/` — routes en layouts (geen andere code)
- `src/components`, `src/lib`, `src/hooks`, `src/constants`, `src/types` — importeren via `@/…`
- `docs/ontwerp/` — visuele overdracht van het Mooove-ontwerp (designsysteem, schermspecificaties, prototype). Dit is de visuele bron voor de app.

## Huidige status van de app

De app is volledig functioneel (Mooove Coach blijft een aangekondigd V2-concept):

- **Account** — inloggen met e-mailcode (Supabase OTP), voornaam en weekdoel in `profiles`, uitloggen en account verwijderen (Edge Function `delete-account`, alle data via `on delete cascade`).
- **Alarmen** — tabel `alarms` (incl. eigen aantal per oefening in `doelen`); eigen alarmgeluid per toestel (Profiel); aanmaken, bewerken, aan/uit en verwijderen in `src/hooks/useAlarmen.tsx`. Native planning via `react-native-alarm-scheduler` (iOS AlarmKit vanaf iOS 26, Android exact alarm met volledig scherm) in `src/lib/alarmen.ts`; synchronisatie op basis van `metadata.versie`.
- **Niveaus** — Vrij: stopknop + snooze. Flexibel: verplaatsen (+15/+30/+60 min). Uitstelbaar: max. 3× snooze. Verplicht: alleen missie. Hardcore: missie + wakker-check na 5 minuten. Alles behalve Vrij is `openAppOnly`: het alarm stopt pas na de missie (`rondWekkerAf`). Tijdens de missie is het alarm 10 minuten uitgesteld; gaat het in die tijd opnieuw af, dan zet de app het stil weer uit zonder de missie te onderbreken (`src/lib/missieStatus.ts`). De noodstop (met bevestiging) stopt het alarm altijd, ook bij strenge niveaus; de missie telt dan als afgebroken. Uitloggen en account verwijderen annuleren alle native alarmen (`annuleerAlles`).
- **Wekker-routing** — `src/hooks/useWekkerRouting.ts` leest de native handoff/context bij koude start, bij terugkeer naar de voorgrond en bij alarm-events en opent `app/wekker.tsx` (zonder dubbele schermen; verouderde handoffs > 15 min worden genegeerd). `/wekker` en `/missie` staan buiten de login-guard en halen niveau, naam en oefeningen uit de native metadata, zodat een alarm ook offline of na een verlopen sessie af te ronden is.
- **Offline** — profiel en alarmen worden lokaal gecachet (`src/lib/opslag.ts`, AsyncStorage); missies die niet direct opgeslagen kunnen worden, gaan in een wachtrij en worden later verstuurd. Native alarmen worden opnieuw gesynchroniseerd bij elke terugkeer naar de voorgrond en na elk afgerond alarm.
- **Missie** — `app/missie.tsx` met `src/components/missie/StapDetector.tsx`: pose-herkenning op het toestel (`react-native-nitro-pose-exercises`, Apple Vision / ML Kit, VisionCamera v5) voor squats, push-ups, jumping jacks en plank; lichtmeting op het Y-vlak voor gordijnen; foto-bevestiging (niet opgeslagen) voor bed opmaken. Handmatig afvinken alleen bij Vrij/Flexibel/Uitstelbaar of zonder alarmmodule. Gesproken coaching via `expo-speech`.
- **Voortgang** — tabel `missie_sessies`; streak (met rustdagen volgens het weekdoel), percentages, reps, weekgrafiek, weekdoel en badges in `src/lib/statistiek.ts`.
- **Reviewers** — na 2 seconden lang drukken op het logo van het inlogscherm kan een testaccount met wachtwoord inloggen (`appreview@linkandlead.nl`; wachtwoord staat niet in de repo). Store-teksten, privacyverklaring en screenshots staan in `docs/store/`.
- **Alarm-check** — echte rechtenstatus (meldingen, alarmen, camera, batterijbesparing op Android), klaarzet-scherm na de eerste login (`app/klaarzetten.tsx`) en een echt testalarm van 30 seconden (`src/hooks/useAlarmCheck.ts`).

Native code: de app draait **niet in Expo Go**; gebruik een development build (`eas build --profile development`). Op web werken alarmen en camera niet (`*.web.ts(x)`-varianten); handig voor UI-tests.

Supabase: migraties in `supabase/migrations/`, Edge Functions in `supabase/functions/`, types in `src/types/database.ts` (bijwerken na elke migratie). Design tokens: `src/constants/theme.ts`; iconen: `src/components/Icon.tsx`; oefeningen: `src/constants/oefeningen.ts`.

## Commando's

```bash
npx expo install <pakket>   # altijd i.p.v. npm install, voor SDK-compatibele versies
npm run lint                # ESLint
npm run typecheck           # tsc --noEmit
npm run format              # Prettier
npm test                    # Jest (unit-tests in src/**/__tests__)
```

Draai `lint`, `typecheck` en `test` voordat een taak af is.

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

- [x] Privacyverklaring geschreven (`docs/store/privacyverklaring.md`)
- [ ] Privacyverklaring online zetten (kant-en-klare statische site in `site/`: `/`, `/privacy`, `/account-verwijderen`) en de URL invullen in App Store Connect en Google Play Console
- [x] Account verwijderen kan in de app zelf (Profiel → Account verwijderen)
- [ ] Web-URL voor verwijderverzoeken (verplicht voor Google Play): `/account-verwijderen` van de site in `site/`
- [ ] App Store privacylabels (App Privacy) ingevuld
- [ ] Google Play Data safety-formulier ingevuld
- [x] Screenshots iPhone 6,9" en 6,5" en Android, plus feature graphic (`docs/store/screenshots/`); iPad is uitgeschakeld
- [x] Testaccount voor de reviewers van Apple en Google (`appreview@linkandlead.nl`, met voorbeelddata)
- [ ] Google Play: declaratie voor `SCHEDULE_EXACT_ALARM`, `USE_FULL_SCREEN_INTENT` en de foreground service (type `specialUse`, reden: "de service speelt het alarm af tot de gebruiker zijn wekmissie heeft afgerond")
- [ ] App Store: uitleg aan de reviewer dat camerabeelden alleen op het toestel worden verwerkt
- [ ] Definitief icoon en splash (nu het conceptlogo `m.` uit `docs/ontwerp/`)
- [ ] `version` in `app.config.ts` opgehoogd per release (build-nummers beheert EAS automatisch)
