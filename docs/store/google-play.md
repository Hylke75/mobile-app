# Google Play Console — Mooove

## Winkelvermelding

- **App-naam:** Mooove
- **Korte beschrijving (max. 80):** De wekker die pas stopt als je in beweging bent. Stop snoozing, start moving.
- **Volledige beschrijving:** gebruik de beschrijving uit `app-store.md` en vervang de regel over iOS 26 door: "Werkt op Android 8.0 en nieuwer."
- **Categorie:** Gezondheid en fitness
- **Contact-e-mail:** hylke@linkandlead.nl
- **Privacybeleid-URL:** _URL van de gepubliceerde `privacyverklaring.md`_

## Gegevensveiligheid (Data safety)

| Vraag                                                                                   | Antwoord                                                            |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Verzamelt of deelt de app gebruikersgegevens?                                           | Ja, verzamelt; deelt niet                                           |
| Versleuteld tijdens verzending?                                                         | Ja                                                                  |
| Kunnen gebruikers verwijdering aanvragen?                                               | Ja (in de app en via de URL voor verwijderverzoeken)                |
| Persoonlijke info → E-mailadres                                                         | Verzameld, verplicht, voor app-functionaliteit en accountbeheer     |
| Persoonlijke info → Naam                                                                | Verzameld, verplicht, voor app-functionaliteit                      |
| App-activiteit → Andere door gebruiker gegenereerde content (alarmen, missieresultaten) | Verzameld, verplicht, voor app-functionaliteit                      |
| App-info en prestaties → Crashlogs (alleen met Sentry)                                  | Verzameld, verplicht, voor analyse; niet gekoppeld aan het account  |
| Foto's en video's                                                                       | **Niet verzameld** (alleen verwerkt op het toestel, niet verzonden) |
| Gezondheid en fitness → Fitnessinfo (herhalingen, voltooide oefeningen)                 | Verzameld, verplicht, voor app-functionaliteit                      |
| Locatie, gezondheidsinfo (medisch), financiële info, contacten, audio                   | Niet verzameld                                                      |

**URL voor verwijderverzoeken:** _URL van de gepubliceerde `account-verwijderen.md`_

## Declaraties voor rechten

**Exacte alarmen (`SCHEDULE_EXACT_ALARM`)**

> Mooove is een wekker-app. Gebruikers stellen zelf alarmen in die exact op de gekozen tijd moeten afgaan om hen te wekken.

**Meldingen op volledig scherm (`USE_FULL_SCREEN_INTENT`)**

> Bij een afgaand alarm toont Mooove een wekker-scherm over het vergrendelscherm, zoals de standaard klok-app. Dit is de kernfunctie van de app.

**Foreground service (type `specialUse`, subtype `alarm`)**

> De service speelt het alarmgeluid af en houdt het wekker-scherm actief tot de gebruiker zijn wekmissie heeft afgerond. Zonder deze service stopt Android het alarm wanneer de app op de achtergrond staat.

**Camera**

> De camera wordt alleen tijdens een missie gebruikt om oefeningen op het toestel te herkennen. Er worden geen beelden opgeslagen of verstuurd.

## App-toegang (voor reviewers)

- **Inloggegevens:** appreview@linkandlead.nl, wachtwoord: _niet in de repo_
- **Instructies:** "Tik op het inlogscherm op 'Inloggen met wachtwoord'. Profiel → 'Test je alarm' laat na 30 seconden een alarm afgaan."

## Inhoudsclassificatie

Vragenlijst invullen: geen geweld, geen gebruikersinteractie, geen gedeelde locatie, geen aankopen → verwachte classificatie PEGI 3.

## Doelgroep

18+ (de app is niet op kinderen gericht).

## Eerste release

De eerste upload van een Android-app moet handmatig in de Play Console (`npx eas-cli@latest build --profile production --platform android`, daarna het `.aab`-bestand uploaden). Volgende versies kunnen via `npx eas-cli@latest submit --platform android`.

## Screenshots

Bestanden in `docs/store/screenshots/android/` (1080 × 2340). Feature graphic (1024 × 500): `docs/store/screenshots/android/feature-graphic.png`.
