# Moov — exact design system

Versie: concept V1.0, 23 oktober 2026. Dit document beschrijft **het daadwerkelijk gemaakte ontwerp**, niet een alternatieve stijl. Voor exacte CSS-specificiteit en overrides: `prototype/styles.css`.

## 1. Merkpersoonlijkheid en visuele richting

**Moov** is een energieke, stijlvolle, sportieve alarm-app. Het ontwerp voelt als een kruising tussen een premium fitnessmerk en een extreem heldere utility-app. De primaire emoties zijn momentum, vertrouwen en positiviteit. Strak, direct, licht rebels, niet kinderachtig.

- Grote, compacte typografie met veel contrast.
- Sportieve 'acid lime' als actiekleur, tegen diep dennegroen/donkerzwart.
- Warme off-white achtergrond voor rust tijdens dagelijks gebruik.
- Zachte maar duidelijke cards; goed zichtbare getallen en alarmtijden.
- Kleine uppercase overlines voor technische precisie.
- Editorial marketingtaal: "STOP SNOOZING. START MOVING.", "YOU GOT THIS", "THE ACTIVE ALARM".
- Dagelijkse interface overwegend in het Nederlands.

## 2. Kleurcodes — exact

### Canonieke tokens uit CSS

| Token | Hex | Gebruik |
|---|---|---|
| `--ink` | `#101714` | Primaire tekst, donkere kaarten, mission-mode, logo-tekst |
| `--ink2` | `#1B2520` | Secundaire diepe groentint |
| `--lime` | `#D8FB59` | Primaire CTA, geselecteerde status, streak-cijfer, logo-accent |
| `--paper` | `#F3F3ED` | Achtergrond van de mobiele app |
| `--white` | `#FFFFFF` | Cards en bottom navigation |
| `--muted` | `#7E8982` | Gedempte labels en metadata |
| `--line` | `#E4E7DD` | Randen en scheidingslijnen |
| `--ice` | `#D9EDEE` | Frisse lichtblauwe coach-accenten |
| `--coral` | `#FF785B` | Eventueel extra accent in merkpalet; niet als primaire CTA |

### Aanvullende, daadwerkelijk gebruikte kleuren

| Hex | Element |
|---|---|
| `#E4ECD9` | Kaart volgende alarm |
| `#B9D7A8` | Verplicht-label in alarmkaart |
| `#EDF1E7` | Neutrale level tags |
| `#E6F5A4` | Level tag Verplicht/Hardcore |
| `#D8EFF0` | Level tag Flexibel |
| `#283326` | Achtergrond klein streak-icoon |
| `#283B2B` | Spraakfeedback op missiescherm |
| `#DCECEF` | Coach hero card |
| `#E6F4D8` | Succesbadge Alarm-check |
| `#2D4B32` | Toggle in ingeschakelde toestand |
| `#E8ECE4` | Niet-geselecteerde dagknop |
| `#EDF4D5` | Geselecteerde oefeningchip |

Kleurgebruik: veel `--paper` en `--white` in gewone schermen, donker `--ink` bij krachtmomenten, lime voor actie en progressie. `--ice` en coral zijn secundair. Verander nooit alle CTA's in het lichtblauw of oranje.

### CSS-variabelen

```css
:root {
  --ink: #101714;
  --ink2: #1b2520;
  --lime: #d8fb59;
  --paper: #f3f3ed;
  --white: #fff;
  --muted: #7e8982;
  --line: #e4e7dd;
  --ice: #d9edee;
  --coral: #ff785b;
  --font-head: 'Space Grotesk', Arial, sans-serif;
  --font-body: 'DM Sans', Arial, sans-serif;
}
```

## 3. Lettertypes

**Headings, grote cijfers en logo:** [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk), gewichten 400/500/600/700. Standaard grote headings 700. Gebruik de bestaande, soms sterke negatieve `letter-spacing`, bijvoorbeeld `-0.065em`, `-0.075em` of `-0.082em`.

**Bodytekst, labels, buttons en microcopy:** [DM Sans](https://fonts.google.com/specimen/DM+Sans), gewichten 400/500/600/700/800. Labels zijn vaak 800 met `letter-spacing: 0.12em` tot `0.24em` en uppercase.

Laad voor web exact deze Google Fonts URL:

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

### Typografische ladder

| Element | Font | Exacte / typische waarde |
|---|---|---|
| Desktop hero | Space Grotesk 700 | `clamp(60px, 6.15vw, 113px)`, line-height `.89`, letter-spacing `-.082em` |
| Desktop outlined woord `START` | Space Grotesk 700 | Transparante fill, `-webkit-text-stroke: 1.8px #F3F3ED` |
| App schermtitel | Space Grotesk 700 | 34–35 px, letter-spacing `-.065em` |
| App sectietitel | Space Grotesk 700 | 18 px, letter-spacing `-.045em` |
| Alarmtijd in overzicht | Space Grotesk 700 | 43 px, line-height `1`, letter-spacing `-.075em` |
| Alarmtijd op dashboard | Space Grotesk 700 | 47 px, line-height `.95`, letter-spacing `-.075em` |
| Streak-cijfer | Space Grotesk 700 | 77 px, line-height `.95`, letter-spacing `-.09em` |
| Reps in live missie | Space Grotesk 700 | 68 px, line-height `.95`, letter-spacing `-.07em` |
| Algemeen body | DM Sans 400–700 | Basis 14 px; belangrijke tekst 12–17 px |
| Knoptekst binnen app | DM Sans 800 | 13 px |
| Overline, kicker | DM Sans 800 | 9–11 px, uppercase, letter-spacing `.12em`–`.24em` |
| Bottom navigation labels | DM Sans 800 | 9 px |

Niet vervangen door Inter, Poppins, Montserrat, Roboto of standaard iOS SF Pro in dit ontwerp. Voor native implementatie moeten fontgewichten expliciet worden gebundeld.

## 4. Logo — exacte huidige conceptopbouw

Er is **geen extern officieel logo aangeleverd**. Het huidige ontwerp bevat een nieuw conceptwoordmerk `moov.` plus een afgerond pictogram met een kleine `m.`.

1. **Pictogram:** lime vierkant `38 × 38 px`, `border-radius: 12px`; kleine letter `m` in Space Grotesk Bold, `29 px`, `letter-spacing: -3px`, tekstkleur `#101714`, lichte rechterpadding van `5px`.
2. **Punt bij kleine m:** `#569126`.
3. **Woordmerk:** `moov.` in Space Grotesk Bold, `30 px`, `letter-spacing: -2px`. Letters off-white op de donkere header. De eindpunt is lime `#D8FB59`.
4. **Tussenruimte pictogram en woordmerk:** `9px`.
5. **Logo in de topheader:** links uitgelijnd, rustige ruimte rondom.

De **exacte HTML/CSS-referentie** is:

```html
<a class="logo lockup" href="#top" aria-label="Moov, naar boven">
  <span class="logo-glyph">m<span class="logo-dot">.</span></span>
  <span class="logo-word">moov<span>.</span></span>
</a>
```

```css
.lockup{display:flex;align-items:center;gap:9px}
.logo-glyph{display:grid;place-items:center;background:#d8fb59;color:#101714;font-family:'Space Grotesk',Arial,sans-serif;font-size:29px;font-weight:700;width:38px;height:38px;border-radius:12px;letter-spacing:-3px;padding-right:5px;line-height:1}
.logo-glyph .logo-dot{color:#569126}
.logo-word{font-size:30px;font-family:'Space Grotesk',Arial,sans-serif;font-weight:700;letter-spacing:-2px}
.logo-word span{color:#d8fb59}
```

In `assets/` staan twee nuttige SVG-varianten als conceptasset. Op web blijft de bovenstaande HTML/CSS-compositie leidend voor pixelnauwkeurigheid. Het logo is nog niet definitief als merk vastgelegd; een toekomstige officiële logo-update is een aparte ontwerpbeslissing.

## 5. Icoonstijl

- Lijniconen met `viewBox="0 0 24 24"`.
- `stroke: currentColor`, `stroke-width: 1.8`, `fill: none`, afgeronde uiteinden en verbindingen.
- Basismaten `20 × 20 px`; bottom nav-iconen `19 × 19 px`.
- Zelf gedefinieerde icon paths staan in `prototype/app.js` in het object `ICONS`. **Dit zijn de exacte iconen**. Bij porten naar React Native: converteer deze paths naar `react-native-svg` of maak equivalenten met dezelfde geometrie.
- Andere visuele accenten gebruiken bewust simpele symbolen of emoji: ✳, ⚡, 🔥, 🏋️, 🛏️, ☀️.

## 6. Vormen, afstanden en lagen

| Component | Maatvoering |
|---|---|
| Phone frame op desktop | `381 × 790 px`, donkere border `8 px`, radius `52 px`, rotatie `-1.2deg` |
| Statusbar in simulatie | `46 px` hoog; op smartphone `54 px` |
| Bottom navigation | `77 px` hoog op desktopframe; `86 px` op smartphone |
| App schermpadding | Zijmarges `23 px` en top `21 px`; op smalle mobiele breedte zijmarge `24 px` |
| Algemene kaart | Radius `18–24 px`; vaak padding `16–23 px` |
| Streak-kaart | Min. hoogte `158 px`, radius `23 px`, padding `21 px`, background `#101714` |
| Volgende-alarmkaart | Radius `21 px`, padding `17px 18px`, background `#E4ECD9` |
| Alarm-lijstkaart | Radius `20 px`, border `1px #E4E7DD`, padding `16 px` |
| Primaire app-button | Min. hoogte `51 px`, radius `15 px`, horizontale padding `18 px`, background `#D8FB59` |
| Secundaire app-button | Min. hoogte `48 px`, radius `15 px`, witte achtergrond, subtiele border |
| Ronde plus-button | `43 × 43 px`, rond, lime |
| Schakelaar | `42 × 25 px`, donker-groen aan, grijsgroen uit |
| Dag-chips | `37 × 37 px`, radius `12 px`; geselecteerd donker met lime tekst |
| Level-keuze | 3 kolommen, radius `12 px`, witte basis; geselecteerd lime |
| Exercise-chip | Pill-vorm, border `1 px`, padding `9px 12px` |

Licht thema voor standaardflow, donker thema alleen voor de missie-ervaring en desktop-presentatie. Gebruik geen zware standaard drop shadows op alle cards; het ontwerp werkt vooral met kleurvlakken, border en typografie.

## 7. Layout en responsive gedrag

### Brede viewport

- Externe presentatie: donker canvas, topheader `100 px`.
- Content is een 2-koloms grid met links het merkverhaal en de schermnavigatie; rechts een telefoonsimulator op groen radiaal vlak.
- Grid: `minmax(480px,1fr)` en `minmax(500px,1.13fr)`.
- Telefoon heeft subtiel 3D-effect en afgeronde zwarte rand.
- Rond de telefoon decoratieve, dunne cirkels. De achtergrond bevat een zeer subtiel 40px raster.
- Onder de hero: stijlgids in drie tiles voor typografie, kleuren en attitude.

### Breakpoints

- `max-width: 1120px`: smallere grid, compacter hero-type, telefoon `365 × 756 px`.
- `max-width: 800px`: 1 kolom; tekst boven, telefoon eronder; design tiles 2 kolommen.
- `max-width: 480px`: **alle desktop-decoratie en marketingtekst weg**. Het telefoonscherm vult direct `100dvh` en `100%` breedte, zonder mockup-border of rotatie. Intern scrollen in `.app-page`; statusbar boven en tabs onder blijven zichtbaar.

### Visuele details

- De hero-achtergrond rechts is een `radial-gradient` van groentinten, niet één vlak.
- Desktop `body` is `#101714`.
- Kleurdetail links: `SNOOZING.` lime, `START` outlined, `MOVING.` wit met lime punt.
- Geen afgeronde standaard-webdesignsecties overal. Het buitenkader is editorial en strak; de mobiel-app heeft afgeronde componenten.

## 8. Knoppen, states en beweging

- Primaire marketingbutton: pill-radius 100 px, lime, donker tekst; hover gaat subtiel `translateY(-3px)`.
- App-CTA: lime, compact en breed, rechts een pijl-icoon.
- Actieve bottom tab: icoon krijgt een lime afgeronde achtergrond; label wordt donker.
- Alarmtoggle: aan `#2D4B32`, uit `#D5DDD5`, witte knop schuift 17 px.
- Mission camera card: donkere radial gradient en fijne groene rasterlijnen; neon-lime lichaamslijnen en scanlijn die op/neer beweegt.
- Toast: bijna zwart, witte tekst, klein lime-checkicoon, onderin boven de tabbar, lichte slide-in.
- Hover-/animatietempo is snel en functioneel, rond `.15–.5s`. Niets bouncy of kinderachtig.

## 9. Copy en tone of voice

- Direct, sportief en positief. "Geen excuses" is voelbaar, zonder beschuldigend te zijn.
- Korte actielabels: "Bekijk de missie-demo", "Alarm opslaan", "Simuleer 5 herhalingen", "Markeer als uitgevoerd".
- Internationale sportbranding is bewust gemixt met Nederlandstalige instructie: "LET'S GO", "ON FIRE", "READY TO MOOV" zijn headings of motivatiemomenten.
- Feedback concreet en menselijk: "Zakken maar. Jij kunt dit!", "Mooi! Hou je rug recht.", "Lekker bezig. Nog even doorzetten."

## 10. Wat niet in de huidige visuele bron staat

- Geen betaalwall of abonnementsflow.
- Geen echte onboardingwizzard met permissies.
- Geen ingelogde backend of echte notificaties.
- Geen echte camerabeelden of modelinferentie.
- Geen volwassen portaal voor fysiotherapeuten.
- Geen officiële, definitieve merkidentiteit buiten dit concept.

Deze onderdelen kunnen later gebouwd worden, maar niet ongemerkt worden toegevoegd of visueel verzonnen bij een 1-op-1-overdracht.
