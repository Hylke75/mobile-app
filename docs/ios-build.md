# iOS-build en TestFlight

Alles in de code is klaar voor iOS (gecontroleerd met een proef-prebuild): bundle ID `nl.linkandlead.mobileapp`, iOS 26 (AlarmKit), toestemmingsteksten in zes talen, privacymanifest, geen push-rechten (alleen lokale herinneringen) en `ITSAppUsesNonExemptEncryption: false`.
**Apple-account (gecontroleerd 28 oktober 2026):** Apple Developer Program als particulier (Individual), actief tot 29 oktober 2027; licentieovereenkomst geaccepteerd; Team ID `5H9Q8P4Q7U` (staat in `app.config.ts` en `eas.json`); Apple-account `hthiry1@me.com`. In het account staat nog niets voor Mooove: geen bundle ID, geen app en geen API-sleutel.

## 1. Wat jij doet (eenmalig, na goedkeuring van Apple)

1. **App aanmaken in App Store Connect** (appstoreconnect.apple.com → Apps → +):
   - Platform: iOS
   - Naam: Mooove (lukt die niet, kies bijvoorbeeld "Mooove: wekker met missie")
   - Primaire taal: Nederlands
   - Bundle ID: `nl.linkandlead.mobileapp` (staat deze nog niet in de lijst, registreer hem dan eerst onder Certificates, Identifiers & Profiles → Identifiers, zonder extra capabilities)
   - SKU: `mooove-ios`
2. **API-sleutel maken** (App Store Connect → Gebruikers en toegang → Integraties → App Store Connect API → +):
   - Naam: EAS, toegang: **Admin** (nodig om certificaten en provisioningprofielen te laten aanmaken)
   - Download het `.p8`-bestand (kan maar één keer) en noteer de **Key ID** en de **Issuer ID**
3. ~~Team ID opzoeken~~ — klaar: `5H9Q8P4Q7U`.
4. **Apple ID van de app** (een getal, bijv. `6740000000`): App Store Connect → je app → App-informatie → Apple ID.

Stuur mij de Key ID, Issuer ID en de app-ID en zet het `.p8`-bestand in de sessie (niet in de repo; `*.p8` staat in `.gitignore`). Dan doe ik stap 2 en 3.

## 2. Build en TestFlight (doe ik)

Met de API-sleutel maakt EAS zelf het distributiecertificaat en het provisioningprofiel aan; je hoeft geen Mac te gebruiken.

```bash
export EXPO_ASC_API_KEY_PATH=/pad/naar/AuthKey_XXXX.p8
export EXPO_ASC_KEY_ID=XXXXXXXXXX
export EXPO_ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
export EXPO_APPLE_TEAM_ID=5H9Q8P4Q7U

eas build --platform ios --profile production --non-interactive
eas submit --platform ios --latest --non-interactive   # na het invullen van ascAppId in eas.json
```

Daarna staat de build binnen ±15 minuten in **TestFlight**. Installeer de TestFlight-app op je iPhone (iOS 26 of nieuwer) en test:

- [ ] Klaarzetten: rechten voor alarmen, camera en meldingen
- [ ] Testalarm van 30 seconden (Profiel → Test je alarm)
- [ ] Alarm op elk niveau: Vrij (stop/snooze), Flexibel (verplaatsen), Uitstelbaar (3× snooze), Verplicht, Hardcore (wakker-check na 5 min)
- [ ] Missie met camera: squats, push-ups, gordijnen (licht), bed opmaken (foto)
- [ ] Noodstop tijdens een strenge missie
- [ ] Alarm gaat af met de telefoon op stil en vergrendeld
- [ ] Herinneringen aan zetten (Profiel) en een melding ontvangen
- [ ] Account verwijderen

Een development-build (met ontwikkelserver) kan ook, maar vraagt eerst het registreren van je iPhone (`eas device:create`). TestFlight is voor deze test eenvoudiger.

## 3. Indienen voor review

In App Store Connect bij de versie invullen (teksten staan klaar):

- Beschrijving, promotietekst, trefwoorden: `docs/store/app-store.md` (andere talen: `docs/store/vertalingen.md`)
- Screenshots 6,9" en 6,5": `docs/store/screenshots/ios-6.9` en `ios-6.5` (per taal in `docs/store/screenshots/<taal>/`)
- Privacybeleid-URL: `https://mooove-app.com/privacy`, support-URL: `https://mooove-app.com/`
- App Privacy (privacylabels): `docs/store/app-store.md`
- Reviewnotities en testaccount: `docs/store/app-store.md` (vul het actuele wachtwoord van `appreview@linkandlead.nl` in)
- Leeftijdsclassificatie: 4+, categorie Gezondheid en fitness

## Google Play (ter vergelijking)

De Android-productiebuild (`.aab`) staat klaar bij EAS. De **eerste** upload doe je met de hand in de Play Console (interne test). Daarna kan `eas submit --platform android` het overnemen met een serviceaccount-sleutel (Play Console → Instellingen → API-toegang); `eas.json` staat al op de interne testtrack als concept.
