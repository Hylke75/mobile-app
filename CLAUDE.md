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

De app is volledig functioneel. Mooove Coach (V2-concept) is voor de eerste release uit de app gehaald (App Store-richtlijn 2.1: geen placeholder-functies); het ontwerp staat nog in `docs/ontwerp/`.

- **Account** — inloggen met e-mailcode (Supabase OTP), voornaam en weekdoel in `profiles`, uitloggen en account verwijderen (Edge Function `delete-account`, alle data via `on delete cascade`).
- **Alarmen** — tabel `alarms` (incl. eigen aantal per oefening in `doelen`); eigen alarmgeluid per toestel (Profiel); aanmaken, bewerken, aan/uit en verwijderen in `src/hooks/useAlarmen.tsx`. Native planning via `react-native-alarm-scheduler` (iOS AlarmKit vanaf iOS 26, Android exact alarm met volledig scherm) in `src/lib/alarmen.ts`; synchronisatie op basis van `metadata.versie`.
- **Niveaus** — Vrij: stopknop + snooze. Flexibel: verplaatsen (+15/+30/+60 min). Uitstelbaar: max. 3× snooze. Verplicht: alleen missie. Hardcore: missie + wakker-check na 5 minuten. Alles behalve Vrij is `openAppOnly`: het alarm stopt pas na de missie (`rondWekkerAf`). Tijdens de missie is het alarm 10 minuten uitgesteld; gaat het in die tijd opnieuw af, dan zet de app het stil weer uit zonder de missie te onderbreken (`src/lib/missieStatus.ts`). De noodstop (met bevestiging) stopt het alarm altijd, ook bij strenge niveaus; de missie telt dan als afgebroken. Uitloggen en account verwijderen annuleren alle native alarmen (`annuleerAlles`).
- **Wekker-routing** — `src/hooks/useWekkerRouting.ts` leest de native handoff/context bij koude start, bij terugkeer naar de voorgrond en bij alarm-events en opent `app/wekker.tsx` (zonder dubbele schermen; verouderde handoffs > 15 min worden genegeerd). `/wekker` en `/missie` staan buiten de login-guard en halen niveau, naam en oefeningen uit de native metadata, zodat een alarm ook offline of na een verlopen sessie af te ronden is.
- **Offline** — profiel en alarmen worden lokaal gecachet (`src/lib/opslag.ts`, AsyncStorage); missies die niet direct opgeslagen kunnen worden, gaan in een wachtrij en worden later verstuurd. Native alarmen worden opnieuw gesynchroniseerd bij elke terugkeer naar de voorgrond en na elk afgerond alarm.
- **Missie** — `app/missie.tsx` met `src/components/missie/StapDetector.tsx`: pose-herkenning op het toestel (`react-native-nitro-pose-exercises`, Apple Vision / ML Kit, VisionCamera v5) voor squats, push-ups, jumping jacks en plank; lichtmeting op het Y-vlak voor gordijnen; foto-bevestiging (niet opgeslagen) voor bed opmaken. Handmatig afvinken alleen bij Vrij/Flexibel/Uitstelbaar of zonder alarmmodule. Gesproken coaching via `expo-speech`.
- **Voortgang** — tabel `missie_sessies` (ook lokaal gecachet; missies in de wachtrij tellen direct mee); streak (met rustdagen volgens het weekdoel), percentages, reps, weekgrafiek, weekdoel, badges en mijlpalen in `src/lib/statistiek.ts`. Na 7 dagen streak eenmalig een store-beoordeling (`src/lib/beoordeling.ts`).
- **Missie-extra's** — proefronde vanuit de editor (`oefen=1`, telt niet mee); na 90 s zonder herkenning een alternatief: sprongen tellen met de bewegingssensor (`src/components/missie/BewegingStap.tsx`, methode `beweging`, telt niet mee voor oefening-badges); reactietijd na het alarm op het eindscherm.
- **Pauze** — `profiles.pauze_tot` (t/m datum); tijdens de pauze plant `synchroniseer` per alarm alleen het eerste alarm erna als eenmalig alarm.
- **Gemak** — scherm blijft aan en trilt bij elke herhaling tijdens de missie; "gaat af over …" in editor, lijst en Vandaag; dupliceren, dubbel-alarmwaarschuwing, ongedaan maken na verwijderen en waarschuwing bij niet-opgeslagen wijzigingen; omlaag trekken om te verversen; foutscherm (`ErrorBoundary` in `app/_layout.tsx`); gegevens downloaden en appversie in Profiel; volgorde van oefeningen; weekoverzicht op maandag/dinsdag; streak delen als afbeelding; meegeleverd zacht opbouwend alarmgeluid (`assets/sounds/zacht-wakker.wav`); eerste alarm direct na het klaarzetten; controle of alle alarmen echt op het toestel staan (Alarm-check).
- **Foutrapporten** — Sentry (`src/lib/fouten.ts`), alleen actief met `EXPO_PUBLIC_SENTRY_DSN`; zonder persoonsgegevens. Supabase-dashboardinstellingen: `docs/supabase-instellingen.md`. Dependabot en een handmatige OTA-workflow staan in `.github/`.
- **Reviewers** — via "Inloggen met wachtwoord" op het inlogscherm kan een testaccount inloggen (`appreview@linkandlead.nl`; wachtwoord staat niet in de repo). Store-teksten, reviewnotities, privacyverklaring en screenshots staan in `docs/store/`. De privacyverklaring staat ook in de app (`app/privacy.tsx`, bereikbaar vanaf inloggen en Profiel; tekst in `src/constants/privacyverklaring.ts`, gelijk houden met `docs/store/privacyverklaring.md` en `site/privacy.html`).
- **App Store-eisen** — privacymanifest (`ios.privacyManifests`), microfoon-tekst (de camerabibliotheek bevat microfooncode), `ITSAppUsesNonExemptEncryption: false` en gezondheidsnotities (welkom, missie) staan in de app.
- **Alarm-check** — echte rechtenstatus (meldingen, alarmen, camera, batterijbesparing op Android), klaarzet-scherm na de eerste login (`app/klaarzetten.tsx`) en een echt testalarm van 30 seconden (`src/hooks/useAlarmCheck.ts`).

Native code: de app draait **niet in Expo Go**; gebruik een development build (`eas build --profile development`). Op web werken alarmen en camera niet (`*.web.ts(x)`-varianten); handig voor UI-tests.

Talen: `src/i18n` (`useTaal()` in componenten, `t()` daarbuiten; groepen in `src/i18n/teksten/`). De taal volgt het toestel, met een keuze in Profiel (opgeslagen in AsyncStorage). iOS-toestemmingsteksten per taal in `locales/*.json`. Database-sleutels voor oefeningen en niveaus blijven Nederlands; tonen via `oefeningNaam`/`niveauNaam`. Store-teksten per taal: `docs/store/vertalingen.md`.

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
- De app is meertalig: Nederlands (bron), Engels, Spaans, Duits en Frans. Geen tekst hard in de code: alles via `t()`/`useTaal()` uit `src/i18n`, en elke nieuwe tekst meteen in alle vijf talen (TypeScript dwingt af dat geen taal een sleutel mist).
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
- [ ] App Store privacylabels (App Privacy) ingevuld volgens `docs/store/app-store.md`
- [ ] Supabase: e-mailtemplate "Magic Link" bevat `{{ .Token }}` en eigen SMTP ingesteld
- [ ] iOS development build getest op een iPhone met iOS 26 (alarm, snooze, missie, noodstop)
- [ ] Google Play Data safety-formulier ingevuld
- [x] Screenshots iPhone 6,9" en 6,5" en Android, plus feature graphic (`docs/store/screenshots/`); iPad is uitgeschakeld
- [x] Testaccount voor de reviewers van Apple en Google (`appreview@linkandlead.nl`, met voorbeelddata)
- [ ] Google Play: declaratie voor `SCHEDULE_EXACT_ALARM`, `USE_FULL_SCREEN_INTENT` en de foreground service (type `specialUse`, reden: "de service speelt het alarm af tot de gebruiker zijn wekmissie heeft afgerond")
- [x] App Store: reviewnotities (camera, alarmniveaus, noodstop, account) staan in `docs/store/app-store.md`
- [ ] Definitief icoon en splash (nu het conceptlogo `m.` uit `docs/ontwerp/`)
- [ ] `version` in `app.config.ts` opgehoogd per release (build-nummers beheert EAS automatisch)
