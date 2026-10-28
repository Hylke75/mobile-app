# App Store Connect — Mooove

## App-informatie

- **Naam:** Mooove App (in App Store Connect; op het toestel "Mooove"). Apple ID `6827886983`, SKU `mooove-ios`
- **Verkoper / ontwikkelaar:** Hylke Thiry (Apple Developer Program als particulier)
- **Copyright:** © 2026 Hylke Thiry
- **Subtitel (max. 30):** Wekker die je laat bewegen
- **Categorie:** Gezondheid en fitness (secundair: Lifestyle)
- **Leeftijdsclassificatie:** 4+ (vragenlijst: overal "Geen"; geen onbeperkte webtoegang, geen gebruikerscontent, geen medische behandelinformatie, geen gokken, geen contests)
- **Privacybeleid-URL:** `https://mooove-app.com/privacy` (statische site in `site/`; moet online staan vóór het indienen; per taal zie `vertalingen.md`)
- **Support-URL:** `https://mooove-app.com/` (bevat contactgegevens)
- **Marketing-URL:** `https://mooove-app.com/`
- **Exportcompliance:** al beantwoord in de build (`ITSAppUsesNonExemptEncryption = false`, alleen standaard HTTPS)
- **Inhoudsrechten:** geen inhoud van derden

## Promotietekst (max. 170)

Stop snoozing. Start moving. Mooove zet je wekker pas uit als je echt in beweging bent gekomen.

## Beschrijving

Mooove is de wekker die je dag sterk laat beginnen. Geen eindeloos snoozen meer: je alarm stopt pas als je je ochtendmissie hebt afgerond.

**Zo werkt het**
• Kies je tijd, dagen en missies uit 16 ochtendmissies, zoals squats, push-ups, plank, je bed opmaken of de gordijnen open. Of maak je eigen missie met een timer of foto.
• Kies hoe streng Mooove is: van Vrij (snoozen mag) tot Hardcore (geen snooze én een wakker-check).
• Als je alarm afgaat, start je missie. De camera telt je herhalingen en controleert of je het echt doet.
• Bouw een streak op, verdien badges en zie je voortgang per week. Mis je een dag, dan vangt je maandelijkse joker hem op.
• Sla een alarm één keer over, pauzeer al je alarmen voor een vakantie en krijg als je wilt de avond ervoor een herinnering.

**Privacy voorop**
Camerabeelden worden alleen op je eigen telefoon verwerkt en nooit opgeslagen of verstuurd.

**Betrouwbaar**
Mooove gebruikt echte systeemalarmen, die ook afgaan als je telefoon op stil of Niet storen staat. Met de ingebouwde alarmtest controleer je dat in 30 seconden.

Mooove vereist iOS 26 of nieuwer voor systeemalarmen.

## Trefwoorden (max. 100 tekens)

wekker,alarm,ochtend,bewegen,squats,fitness,routine,streak,opstaan,snooze,missie,workout

## App Privacy (privacylabels)

**Data die aan je identiteit is gekoppeld**

- Contactgegevens → E-mailadres — App-functionaliteit
- Contactgegevens → Naam — App-functionaliteit
- Gezondheid en fitness → Fitness (aantallen herhalingen en voltooide oefeningen) — App-functionaliteit
- Identificatoren → Gebruikers-ID (account-ID) — App-functionaliteit
- Gebruiksdata → Productinteractie (alarmen, missieresultaten) — App-functionaliteit
- Gebruikerscontent → Overige gebruikerscontent (namen van eigen missies, ochtendgevoel na een missie, feedbackberichten) — App-functionaliteit
- Gebruikerscontent → Klantenservice (feedbackberichten uit de app) — App-functionaliteit

**Data die niet aan je identiteit is gekoppeld** (alleen als Sentry aan staat)

- Diagnostiek → Crashgegevens — App-functionaliteit

**Niet verzameld:** locatie, gezondheid (medisch), foto's of video's (camerabeelden blijven op het toestel), audio, contacten, aankopen, apparaat-ID's, advertentiedata.
**Gebruikt voor tracking:** nee. Deze antwoorden komen overeen met het privacymanifest in de build (`ios.privacyManifests` in `app.config.ts`).
**Tracking:** nee.

## Gegevens voor de review (App Review Information)

- **Inloggen vereist:** nee ("Continue without an account"); demo-account voor een ingevuld voorbeeld
- **Gebruikersnaam:** appreview@linkandlead.nl
- **Wachtwoord:** _staat niet in de repo; zie het bericht van Claude of je wachtwoordkluis_
- **Notities voor de reviewer** (plak in App Review Information → Notes):

> NO LOGIN REQUIRED: On the first screen, tap "Continue without an account" to use every feature right away. Optionally, a guest can later link an email address in Profile to keep their data on a new phone.
>
> DEMO ACCOUNT (with sample alarms and progress): tap "Log in with password" (Dutch: "Inloggen met wachtwoord") below the main button and use the demo account above. Regular users sign in with a one-time code sent by email. The demo account contains sample alarms and progress. The app follows the device language (English, Dutch, Spanish, German, French or Chinese); it can be changed in Profile → Language.
>
> ACCOUNT: Signing in with email is optional; it keeps alarms, streak and workout history when the user switches or reinstalls their phone. Every account, also a guest account, can be deleted in the app: Profile → Delete account.
>
> ALARMS: Mooove is an alarm clock built on AlarmKit (iOS 26+). The user chooses a strictness level per alarm; new alarms start at "Flexible". When the user picks "Mandatory" or "Hardcore", the app first shows an explanation that this alarm only stops via the mission and that the emergency stop always works. At these levels the alarm only stops after the user completes a short movement mission (e.g. 10 squats); pressing Stop on the lock screen re-rings the alarm and opens the mission. This is the core feature, chosen by the user. An "Emergency stop" button is always visible during a mission and stops the alarm immediately at every level. At the level "Free" the system Stop button works as usual.
>
> QUICK TEST: Profile → "Test your alarm" rings a test alarm after 30 seconds. Today → "Start your mission now" starts a mission without an alarm.
>
> CAMERA: Used only during a mission for on-device pose detection (Apple Vision), a brightness check (curtains open) and a confirmation photo (bed made). Nothing is stored or sent; no audio is recorded. The microphone usage string exists only because the camera library contains audio code; the app never requests microphone access. If camera access is denied, missions can be marked as done manually at the levels Free, Flexible and Snoozable.
>
> PRIVACY: Profile → Privacy shows the full privacy policy in the app.

## Beschikbaarheid

- **China (vasteland) uitzetten** (Pricing and Availability): voor publicatie daar eist Apple een ICP-registratie bij het Chinese ministerie (MIIT). Chinees blijft beschikbaar in o.a. Taiwan, Hongkong, Singapore en Maleisië.

## URL's zolang `mooove-app.com` nog niet bestaat

Gebruik tijdelijk het Vercel-adres (zelfde site, alle talen): `https://mobile-app-sage-ten.vercel.app/privacy` (privacybeleid), `https://mobile-app-sage-ten.vercel.app/` (support en marketing). Vervang ze na het registreren van het domein.

## Screenshots

Gebruik bij voorkeur de versies met koptekst: `docs/store/screenshots-tekst/<taal>/ios-6.9/` (1320 × 2868) en `ios-6.5/` (1284 × 2778), per taal (`nl`, `en`, `es`, `de`, `fr`, `zh`). De kale schermen staan in `docs/store/screenshots/`.
