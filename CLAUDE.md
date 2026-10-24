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
- **Missies** — 16 ingebouwde missies in `src/constants/oefeningen.ts` (groepen Beweging en Ochtendroutine; methodes pose/licht/foto/timer) plus eigen missies (tabel `eigen_missies`: naam, emoji, timer of foto). In een alarm staan ingebouwde missies op naam en eigen missies als `eigen:<uuid>` (gecontroleerd door `geldige_missies()`, max. 12). Alles wat een missie toont, gaat via `missieInfo`/`missieInfos` in `src/lib/missies.ts`; eigen missies reizen mee in de native metadata (`eigen`) zodat ze ook offline werken.
- **Alarmen** — tabel `alarms` (incl. eigen aantal per oefening in `doelen`); eigen alarmgeluid per toestel (Profiel); aanmaken, bewerken, aan/uit en verwijderen in `src/hooks/useAlarmen.tsx`. Native planning via `react-native-alarm-scheduler` (iOS AlarmKit vanaf iOS 26, Android exact alarm met volledig scherm) in `src/lib/alarmen.ts`; synchronisatie op basis van `metadata.versie`.
- **Niveaus** — Vrij: stopknop + snooze. Flexibel: verplaatsen (+15/+30/+60 min). Uitstelbaar: max. 3× snooze. Verplicht: alleen missie. Hardcore: missie + wakker-check na 5 minuten. Alles behalve Vrij is `openAppOnly`: het alarm stopt pas na de missie (`rondWekkerAf`). Tijdens de missie is het alarm 10 minuten uitgesteld; gaat het in die tijd opnieuw af, dan zet de app het stil weer uit zonder de missie te onderbreken (`src/lib/missieStatus.ts`). De noodstop (met bevestiging) stopt het alarm altijd, ook bij strenge niveaus; de missie telt dan als afgebroken. Uitloggen en account verwijderen annuleren alle native alarmen (`annuleerAlles`).
- **Wekker-routing** — `src/hooks/useWekkerRouting.ts` leest de native handoff/context bij koude start, bij terugkeer naar de voorgrond en bij alarm-events en opent `app/wekker.tsx` (zonder dubbele schermen; verouderde handoffs > 15 min worden genegeerd). `/wekker` en `/missie` staan buiten de login-guard en halen niveau, naam en oefeningen uit de native metadata, zodat een alarm ook offline of na een verlopen sessie af te ronden is.
- **Offline** — profiel en alarmen worden lokaal gecachet (`src/lib/opslag.ts`, AsyncStorage); missies die niet direct opgeslagen kunnen worden, gaan in een wachtrij en worden later verstuurd. Native alarmen worden opnieuw gesynchroniseerd bij elke terugkeer naar de voorgrond en na elk afgerond alarm.
- **Missie** — `app/missie.tsx` met `src/components/missie/StapDetector.tsx`: pose-herkenning op het toestel (`react-native-nitro-pose-exercises`, Apple Vision / ML Kit, VisionCamera v5) voor squats, push-ups, jumping jacks en plank; lichtmeting op het Y-vlak voor gordijnen; foto-bevestiging (niet opgeslagen) voor bed opmaken. Handmatig afvinken alleen bij Vrij/Flexibel/Uitstelbaar of zonder alarmmodule. Gesproken coaching via `expo-speech`.
- **Missiescherm** — kaart met emoji, naam, doel, plaatsing van de telefoon en de volgende stap; timer-missies via `src/components/missie/TimerStap.tsx`.
- **Voortgang** — tabel `missie_sessies` (ook lokaal gecachet; missies in de wachtrij tellen direct mee); streak (met rustdagen volgens het weekdoel), percentages, reps, weekgrafiek, weekdoel, badges (met voortgang, bijv. 34/100) en mijlpalen in `src/lib/statistiek.ts`. Na 7 dagen streak eenmalig een store-beoordeling (`src/lib/beoordeling.ts`).
- **Missie-extra's** — proefronde vanuit de editor (`oefen=1`, telt niet mee); na 90 s zonder herkenning een alternatief: sprongen tellen met de bewegingssensor (`src/components/missie/BewegingStap.tsx`, methode `beweging`, telt niet mee voor oefening-badges); reactietijd na het alarm op het eindscherm.
- **Pauze en overslaan** — `profiles.pauze_tot` (t/m datum) en per alarm `alarms.overslaan_op` (één keer overslaan via de alarmlijst); `synchroniseer` plant dan per alarm alleen het eerste alarm erna als eenmalig alarm. `volgendeKeer` houdt rekening met de overgeslagen dag.
- **Alarmopties** — per alarm `alarms.wisselend` (elke ochtend één missie uit de lijst, `missiesVanDag` in `src/lib/missies.ts`) en `alarms.feestdagen_overslaan` (landelijke feestdagen van het toestelland, `src/lib/feestdagen.ts`); geluid per alarm alleen lokaal (`leesGeluidKeuzes`/`zetGeluidKeuze` in `src/lib/alarmgeluid.ts`). `planMoment` in `src/lib/tijd.ts` bepaalt of een alarm herhalend of eenmalig wordt ingepland (pauze, overslaan, feestdag).
- **Ochtendgevoel en feedback** — na een voltooide missie optioneel moe/oké/sterk (`missie_sessies.gevoel`, alleen die kolom is achteraf bij te werken; offline via `SLEUTELS.gevoelWachtrij`), getoond in Progressie. Feedback vanuit Profiel in tabel `feedback` (alleen eigen berichten lezen/aanmaken).
- **Streak-joker** — één per kalendermaand, automatisch: een gemiste dag die de streak zou breken telt niet (`streaks` in `src/lib/statistiek.ts`); getoond in Voortgang.
- **Herinneringen** — lokale meldingen via `expo-notifications` (geen push): de avond ervoor om 21:00 voor ochtendalarmen en om 19:00 als de streak in gevaar is (`streakInGevaar`). Aan/uit in Profiel (standaard uit, AsyncStorage); de planning staat in `src/lib/herinneringPlan.ts`, het inplannen in `src/lib/herinneringen.ts` en `src/hooks/useHerinneringen.ts`.
- **Gemak** — scherm blijft aan en trilt bij elke herhaling tijdens de missie; "gaat af over …" in editor, lijst en Vandaag; dupliceren, dubbel-alarmwaarschuwing, ongedaan maken na verwijderen en waarschuwing bij niet-opgeslagen wijzigingen; omlaag trekken om te verversen; foutscherm (`ErrorBoundary` in `app/_layout.tsx`); gegevens downloaden en appversie in Profiel; volgorde van oefeningen; weekoverzicht op maandag/dinsdag; streak delen als afbeelding; meegeleverd zacht opbouwend alarmgeluid (`assets/sounds/zacht-wakker.wav`); eerste alarm direct na het klaarzetten; controle of alle alarmen echt op het toestel staan (Alarm-check).
- **Foutrapporten** — Sentry (`src/lib/fouten.ts`), alleen actief met `EXPO_PUBLIC_SENTRY_DSN`; zonder persoonsgegevens. Supabase-dashboardinstellingen: `docs/supabase-instellingen.md`. Dependabot, een handmatige OTA-workflow (`update.yml`), automatische OTA naar `preview` na elke push naar `main` (`ota-preview.yml`, alleen met secret `EXPO_TOKEN`) en een handmatige Maestro-run op een Android-emulator (`maestro.yml`) staan in `.github/`. De app haalt OTA-updates op de achtergrond op en toont boven de tabbalk "Nieuwe versie klaar — Herstart" (`src/hooks/useAppUpdate.ts`). Back-ups en hersteloefening: `docs/back-ups.md`. Edge Functions voor account verwijderen en beheer hebben een misbruikrem via tabel `misbruikrem`. De controle draait ook de schermtests; de volledige flow met testaccount alleen met de GitHub-variabelen `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` en de secrets `E2E_EMAIL`/`E2E_WACHTWOORD`.
- **Site en beheer** — `site/` is de statische site voor `https://mooove-app.com` (domein in `scripts/bouw-site.mjs`): presentatiepagina in vijf talen (`/`, `/en/` …; teksten in `scripts/site-teksten.mjs`, opmaak in `scripts/site-landing.mjs`, schermen in `site/beelden/` via `scripts/site-beelden.py`), privacy en account verwijderen, en de beheeromgeving `/admin` (`scripts/site-admin.html`). Bouwen met `npm run site`; deelplaatjes (`site/beelden/<taal>/deel.png`) met `node scripts/site-deelplaatje.mjs`. Wachtlijst op de site via de openbare Edge Function `wachtlijst` (tabel `wachtlijst`, misbruikrem in tabel `misbruikrem` met alleen gehashte IP's). Beheer haalt data via de Edge Function `admin-overzicht` (gebruikers, trechter, retentie per aanmeldweek, ochtendgevoel, feedback, wachtlijst) en voert hulpacties uit via `admin-actie` (inlogcode sturen, account verwijderen met bevestiging, wachtlijst opschonen; gelogd in `beheer_log`, max. 30 per uur), alleen voor accounts in `public.admins` (zie `docs/supabase-instellingen.md`).
- **Reviewers** — via "Inloggen met wachtwoord" op het inlogscherm kan een testaccount inloggen (`appreview@linkandlead.nl`; wachtwoord staat niet in de repo). Store-teksten, reviewnotities, privacyverklaring en screenshots staan in `docs/store/`. De privacyverklaring staat ook in de app (`app/privacy.tsx`, bereikbaar vanaf inloggen en Profiel; tekst in `src/constants/privacyverklaring.ts`, gelijk houden met `docs/store/privacyverklaring.md` en `site/privacy.html`).
- **App Store-eisen** — privacymanifest (`ios.privacyManifests`), microfoon-tekst (de camerabibliotheek bevat microfooncode), `ITSAppUsesNonExemptEncryption: false` en gezondheidsnotities (welkom, missie) staan in de app.
- **Alarm-check** — echte rechtenstatus (meldingen, alarmen, camera, batterijbesparing op Android), klaarzet-scherm na de eerste login (`app/klaarzetten.tsx`) en een echt testalarm van 30 seconden (`src/hooks/useAlarmCheck.ts`).

Native code: de app draait **niet in Expo Go**; gebruik een development build (`eas build --profile development`). Op web werken alarmen en camera niet (`*.web.ts(x)`-varianten); handig voor UI-tests.

Talen: `src/i18n` (`useTaal()` in componenten, `t()` daarbuiten; groepen in `src/i18n/teksten/`). De taal volgt het toestel, met een keuze in Profiel (opgeslagen in AsyncStorage). iOS-toestemmingsteksten per taal in `locales/*.json`. Database-sleutels voor oefeningen en niveaus blijven Nederlands; tonen via `oefeningNaam`/`niveauNaam`. Store-teksten per taal: `docs/store/vertalingen.md`.

Supabase: migraties in `supabase/migrations/`, Edge Functions in `supabase/functions/`, types in `src/types/database.ts` (bijwerken na elke migratie). Design tokens: `src/constants/theme.ts` (`LICHT` is het ontwerp, `DONKER` wordt afgeleid via `vlak`/`tint`/`rand`; tekst op limegroen altijd `opLime`). Schermen met lichte achtergrond gebruiken `maakStijlen((k) => StyleSheet.create(…))` en `useKleuren()` uit `src/hooks/useThema.tsx`; de keuze Automatisch/Licht/Donker staat in Profiel. Wekker-, missie- en inlogschermen zijn altijd donker; iconen: `src/components/Icon.tsx`; oefeningen: `src/constants/oefeningen.ts`.

## Commando's

```bash
npx expo install <pakket>   # altijd i.p.v. npm install, voor SDK-compatibele versies
npm run lint                # ESLint
npm run typecheck           # tsc --noEmit
npm run format              # Prettier
npm test                    # Jest (unit-tests in src/**/__tests__)
npm run e2e                 # Playwright-schermtests op de web-export (e2e/web)
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
- [ ] Site online zetten op `https://mooove-app.com` (kant-en-klare statische site in `site/`, met `sitemap.xml` en `robots.txt`: `/`, `/privacy`, `/account-verwijderen`, ook onder `/en`, `/es`, `/de`, `/fr`; vertaalde pagina's bouwen met `npm run site` uit `src/i18n/teksten/privacy.ts`) en de URL invullen in App Store Connect en Google Play Console
- [x] Account verwijderen kan in de app zelf (Profiel → Account verwijderen)
- [ ] Web-URL voor verwijderverzoeken (verplicht voor Google Play): `https://mooove-app.com/account-verwijderen`
- [ ] App Store privacylabels (App Privacy) ingevuld volgens `docs/store/app-store.md`
- [ ] Supabase: e-mailtemplate "Magic Link" bevat `{{ .Token }}` en eigen SMTP ingesteld
- [ ] iOS-build via TestFlight getest op een iPhone met iOS 26 (alarm, snooze, missie, noodstop); stappenplan in `docs/ios-build.md`
- [ ] Google Play Data safety-formulier ingevuld
- [x] Screenshots iPhone 6,9" en 6,5" en Android, plus feature graphic (`docs/store/screenshots/`); met koptekst voor de stores in `docs/store/screenshots-tekst/` (`node scripts/store-screenshots-tekst.mjs`); iPad is uitgeschakeld
- [x] Testaccount voor de reviewers van Apple en Google (`appreview@linkandlead.nl`, met voorbeelddata)
- [ ] Google Play: declaratie voor `SCHEDULE_EXACT_ALARM`, `USE_FULL_SCREEN_INTENT` en de foreground service (type `specialUse`, reden: "de service speelt het alarm af tot de gebruiker zijn wekmissie heeft afgerond")
- [x] App Store: reviewnotities (camera, alarmniveaus, noodstop, account) staan in `docs/store/app-store.md`
- [ ] Definitief icoon en splash (nu het conceptlogo `m.` uit `docs/ontwerp/`)
- [ ] `version` in `app.config.ts` opgehoogd per release (build-nummers beheert EAS automatisch)
