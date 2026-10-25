# Google Play Console — Mooove

## Winkelvermelding

- **App-naam:** Mooove
- **Korte beschrijving (max. 80):** De wekker die pas stopt als je in beweging bent. Stop snoozing, start moving.
- **Volledige beschrijving:** gebruik de beschrijving uit `app-store.md` en vervang de regel over iOS 26 door: "Werkt op Android 8.0 en nieuwer."
- **Categorie:** Gezondheid en fitness
- **Contact-e-mail:** hylke@linkandlead.nl
- **Privacybeleid-URL:** `https://mooove-app.com/privacy`
- **Website:** `https://mooove-app.com/`

## Gegevensveiligheid (Data safety)

| Vraag                                                                                                  | Antwoord                                                            |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Verzamelt of deelt de app gebruikersgegevens?                                                          | Ja, verzamelt; deelt niet                                           |
| Versleuteld tijdens verzending?                                                                        | Ja                                                                  |
| Kunnen gebruikers verwijdering aanvragen?                                                              | Ja (in de app en via de URL voor verwijderverzoeken)                |
| Persoonlijke info → E-mailadres                                                                        | Verzameld, verplicht, voor app-functionaliteit en accountbeheer     |
| Persoonlijke info → Naam                                                                               | Verzameld, verplicht, voor app-functionaliteit                      |
| App-activiteit → Andere door gebruiker gegenereerde content (alarmen, missieresultaten, ochtendgevoel) | Verzameld, verplicht, voor app-functionaliteit                      |
| Berichten → Andere berichten in de app (feedback)                                                      | Verzameld, optioneel, voor app-functionaliteit                      |
| App-info en prestaties → Crashlogs (alleen met Sentry)                                                 | Verzameld, verplicht, voor analyse; niet gekoppeld aan het account  |
| Foto's en video's                                                                                      | **Niet verzameld** (alleen verwerkt op het toestel, niet verzonden) |
| Gezondheid en fitness → Fitnessinfo (herhalingen, voltooide oefeningen)                                | Verzameld, verplicht, voor app-functionaliteit                      |
| Locatie, gezondheidsinfo (medisch), financiële info, contacten, audio                                  | Niet verzameld                                                      |

**URL voor verwijderverzoeken:** `https://mooove-app.com/account-verwijderen`

## Declaraties voor rechten

**Exacte alarmen (`SCHEDULE_EXACT_ALARM`)**

> Mooove is een wekker-app. Gebruikers stellen zelf alarmen in die exact op de gekozen tijd moeten afgaan om hen te wekken.

**Meldingen op volledig scherm (`USE_FULL_SCREEN_INTENT`)**

> Bij een afgaand alarm toont Mooove een wekker-scherm over het vergrendelscherm, zoals de standaard klok-app. Dit is de kernfunctie van de app.

**Foreground service (type `specialUse`, subtype `alarm`)**

> De service speelt het alarmgeluid af en houdt het wekker-scherm actief tot de gebruiker zijn wekmissie heeft afgerond. Zonder deze service stopt Android het alarm wanneer de app op de achtergrond staat.

**Camera**

> De camera wordt alleen tijdens een missie gebruikt om oefeningen op het toestel te herkennen. Er worden geen beelden opgeslagen of verstuurd.

**Video voor de foreground service (verplicht)**

Google vraagt per foreground-servicetype een link naar een video (bijv. YouTube, niet openbaar) die laat zien hoe de functie wordt gestart. Opname van ±30 s op een Android-telefoon: Profiel → Test je alarm → telefoon vergrendelen → het alarm gaat af over het vergrendelscherm en blijft klinken → Start missie → missie afronden (of Noodstop) → het alarm stopt.

## Health apps-verklaring (App-inhoud → Gezondheid)

Verplicht voor elke app. Kies **Activity and fitness** (de app registreert oefeningen en herhalingen). Geen medische functies, geen Health Connect, geen gezondheidsgegevens van andere apps.

## Productietoegang (persoonlijk ontwikkelaarsaccount)

Is het Play-account na 13 november 2023 als **persoonlijk** account aangemaakt, dan moet eerst een gesloten test lopen met minimaal **12 testers die 14 dagen achter elkaar** meedoen; pas daarna kun je productietoegang aanvragen (Dashboard in de Play Console). Start de gesloten test zo vroeg mogelijk met de preview- of productiebuild. Organisatie-accounts zijn hiervan vrijgesteld.

## URL's zolang `mooove-app.com` nog niet bestaat

Privacybeleid: `https://mobile-app-sage-ten.vercel.app/privacy` · Verwijderverzoeken: `https://mobile-app-sage-ten.vercel.app/account-verwijderen` · Website: `https://mobile-app-sage-ten.vercel.app/`.

## App-toegang (voor reviewers)

- **Inloggen nodig?** Nee: "Continue without an account" geeft toegang tot alles. Voor een ingevuld voorbeeld: appreview@linkandlead.nl, wachtwoord _niet in de repo_.
- **Instructies (Engels, plakken in App-toegang):** "On the login screen tap 'Log in with password' (Dutch: 'Inloggen met wachtwoord') and use the credentials above. Profile → 'Test your alarm' rings a test alarm after 30 seconds. During a mission, 'Emergency stop' always stops the alarm."

## Inhoudsclassificatie

Vragenlijst invullen: geen geweld, geen gebruikersinteractie, geen gedeelde locatie, geen aankopen → verwachte classificatie PEGI 3.

## Doelgroep

18+ (de app is niet op kinderen gericht).

## Eerste release

De eerste upload van een Android-app moet handmatig in de Play Console (`npx eas-cli@latest build --profile production --platform android`, daarna het `.aab`-bestand uploaden). Volgende versies kunnen via `npx eas-cli@latest submit --platform android`.

## Screenshots

Bestanden in `docs/store/screenshots/android/` (1080 × 2340). Feature graphic (1024 × 500): `docs/store/screenshots/android/feature-graphic.png`.
