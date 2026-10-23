# Moov — complete overdracht naar Claude Code

Deze map bevat het **bestaande, interactieve ontwerp** plus alle informatie om het pixelgetrouw na te bouwen of naar React Native te vertalen.

## Inhoud

| Bestand | Doel |
|---|---|
| `OPDRACHT.md` | Direct uitvoerbare opdracht en harde acceptatiecriteria voor Claude Code |
| `DESIGN_SYSTEM.md` | Exacte kleuren, fonts, logo, iconen, maten, cards, buttons en responsive regels |
| `SCREEN_SPECS.md` | Alle schermen, content, mockdata, acties en overgangen |
| `prototype/index.html` | De merkpresentatie en app-container uit het werkende ontwerp |
| `prototype/styles.css` | **Enige definitieve visuele bron** voor componentstijlen |
| `prototype/app.js` | **Enige definitieve bron** voor iconen, tekst, schermen en demo-interactie |
| `assets/moov-concept-icon.svg` | SVG-hulpmiddel voor het `m.`-appicoon |
| `assets/moov-concept-lockup.svg` | SVG-hulpmiddel voor de logo-lockup op donkere achtergrond |

## Snel starten

1. Pak de ZIP uit in de projectmap van Claude Code.
2. Open Claude Code in deze map.
3. Geef Claude deze opdracht:

> Lees eerst `OPDRACHT.md`, `DESIGN_SYSTEM.md` en `SCREEN_SPECS.md` volledig. Gebruik de bronbestanden in `prototype/` als exacte visuele bron. Bouw Moov pixelgetrouw na. Pas geen branding, kleuren, fonts, iconen, afstanden of copy aan zonder mijn toestemming. Begin met een inventaris van componenten en schermen en implementeer daarna het ontwerp conform de acceptatiecriteria. De camera- en alarmfuncties in de prototypecode zijn simulaties en moeten als zodanig herkenbaar blijven.

## Lokale referentie starten

Het prototype heeft geen npm-installatie nodig. Serveer de `prototype/`-map met een eenvoudige statische HTTP-server en open `index.html`.

Gepubliceerde ontwerp-preview:

https://moov-app-ontwerp-2026.rosycomet4.chatgpt.site

## Visuele bronprioriteit

1. `prototype/styles.css` en het resultaat van de live preview.
2. `prototype/index.html` en `prototype/app.js`.
3. Deze Markdown-specificaties.
4. De SVG-hulplogo's.

De SVG's bevatten tekst en vertrouwen voor correcte lettervormen op de aanwezigheid van Space Grotesk. Voor de exact waargenomen huidige webcompositie heeft het HTML/CSS-logo daarom voorrang.

Het ontwerp is een prototype, geen productierijpe alarm-, camera- of fysiotherapie-app.
