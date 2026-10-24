# App Store Connect — Mooove

## App-informatie

- **Naam:** Mooove
- **Subtitel (max. 30):** Wekker die je laat bewegen
- **Categorie:** Gezondheid en fitness (secundair: Lifestyle)
- **Leeftijdsclassificatie:** 4+ (vragenlijst: overal "Geen"; geen onbeperkte webtoegang, geen gebruikerscontent, geen medische behandelinformatie, geen gokken, geen contests)
- **Privacybeleid-URL:** `https://<jouw-domein>/privacy` (statische site in `site/`; moet online staan vóór het indienen)
- **Support-URL:** `https://<jouw-domein>/` (bevat contactgegevens)
- **Exportcompliance:** al beantwoord in de build (`ITSAppUsesNonExemptEncryption = false`, alleen standaard HTTPS)
- **Inhoudsrechten:** geen inhoud van derden

## Promotietekst (max. 170)

Stop snoozing. Start moving. Mooove zet je wekker pas uit als je echt in beweging bent gekomen.

## Beschrijving

Mooove is de wekker die je dag sterk laat beginnen. Geen eindeloos snoozen meer: je alarm stopt pas als je je ochtendmissie hebt afgerond.

**Zo werkt het**
• Kies je tijd, dagen en missies: squats, push-ups, jumping jacks, plank, je bed opmaken of de gordijnen open.
• Kies hoe streng Mooove is: van Vrij (snoozen mag) tot Hardcore (geen snooze én een wakker-check).
• Als je alarm afgaat, start je missie. De camera telt je herhalingen en controleert of je het echt doet.
• Bouw een streak op, verdien badges en zie je voortgang per week.

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

**Niet verzameld:** locatie, gezondheid (medisch), foto's of video's (camerabeelden blijven op het toestel), audio, contacten, aankopen, apparaat-ID's, diagnostiek, advertentiedata.
**Gebruikt voor tracking:** nee. Deze antwoorden komen overeen met het privacymanifest in de build (`ios.privacyManifests` in `app.config.ts`).
**Tracking:** nee.

## Gegevens voor de review (App Review Information)

- **Inloggen vereist:** ja
- **Gebruikersnaam:** appreview@linkandlead.nl
- **Wachtwoord:** _staat niet in de repo; zie het bericht van Claude of je wachtwoordkluis_
- **Notities voor de reviewer** (plak in App Review Information → Notes):

> LOGIN: Tap "Inloggen met wachtwoord" below the button on the login screen and use the demo account above. Regular users sign in with a one-time code sent by email. The demo account contains sample alarms and progress.
>
> WHY AN ACCOUNT: Mooove stores the user's alarms, streak and workout history in their account so it is kept and synced when they switch or reinstall their phone. The account and all data can be deleted in the app: Profiel → Account verwijderen.
>
> ALARMS: Mooove is an alarm clock built on AlarmKit (iOS 26+). At the levels "Verplicht" and "Hardcore" the alarm only stops after the user completes a short movement mission (e.g. 10 squats). This is the core feature, chosen by the user per alarm. An emergency stop ("Noodstop") is always available during a mission and stops the alarm immediately. At the level "Vrij" the system Stop button works as usual.
>
> QUICK TEST: Profiel → "Test je alarm" rings a test alarm after 30 seconds. Vandaag → "Start je missie nu" starts a mission without an alarm.
>
> CAMERA: Used only during a mission for on-device pose detection (Apple Vision), a brightness check (curtains open) and a confirmation photo (bed made). Nothing is stored or sent; no audio is recorded. The microphone usage string exists only because the camera library contains audio code; the app never requests microphone access.
>
> PRIVACY: Profiel → Privacy shows the full privacy policy in the app.

## Screenshots

Bestanden in `docs/store/screenshots/ios-6.9/` (1320 × 2868) en `ios-6.5/` (1284 × 2778).
