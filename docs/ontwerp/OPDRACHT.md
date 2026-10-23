# Moov — opdracht voor Claude Code

## Opdracht

Bouw de Moov-app zo dat het uiterlijk **pixelgetrouw** overeenkomt met de meegeleverde interactieve prototypecode. Behoud alle gekozen vormen, kleuren, fonts, verhoudingen, copy, iconen, hiërarchie en schermovergangen. Dit is een implementatieopdracht, geen nieuwe ontwerpopdracht.

De oorspronkelijke, gepubliceerde visuele referentie is:

https://moov-app-ontwerp-2026.rosycomet4.chatgpt.site

De drie bronbestanden staan in `prototype/`:

- `index.html` — ontwerp-presentatie, merklogo en desktop-telefoonframe;
- `styles.css` — **de canonieke bron van alle design tokens en componentstijlen**;
- `app.js` — de navigatie, scherminhoud, iconen, voorbeelddata en klikgedrag.

Lees eerst `DESIGN_SYSTEM.md` en `SCREEN_SPECS.md`. Gebruik vervolgens de meegeleverde bestanden als broncode. Als deze documenten en de broncode op een detail verschillen, wint de broncode voor de **visuele** uitvoering. Neem geen stilzwijgende esthetische vrijheid.

## Verplichte werkvolgorde

1. Draai de statische referentie uit `prototype/` lokaal met een eenvoudige HTTP-server. Controleer eerst dat hij eruitziet als de referentie-URL.
2. Maak een scherminventaris en een componentenmatrix uit `SCREEN_SPECS.md`.
3. Implementeer eerst de design tokens, fonts, logo, iconen, cards, knoppen en navigatie als herbruikbare componenten.
4. Bouw de schermen in deze volgorde: Vandaag, Alarmen, Nieuw alarm, Live missie, Progressie, Profiel en Moov Coach.
5. Neem de demo-interacties over: navigeren, alarm toggelen, tijd/dagen/niveau/missies kiezen, alarm opslaan, drie missierondes afwerken, stats bekijken en testalarm simuleren.
6. Vergelijk de implementatie visueel bij een viewport van 390 × 844, 375 × 812 en 1440 × 900 met de referentie. Corrigeer verschillen vóór het toevoegen van echte native logica.
7. Scheid UI, statusbeheer en platformdiensten. Maak expliciet welke schermen nog mockdata bevatten.

## Technische keuzes

Wanneer je een echte mobiele app bouwt: gebruik conform het productdocument React Native met Expo en native modules waar het platformgedrag dat nodig maakt. Vertaal de bestaande UI naar React Native componenten en stijlen zonder de vormgeving te veranderen. Gebruik `Space Grotesk` voor headings en cijfers en `DM Sans` voor interface- en bodytekst. Neem niet zomaar een alternatieve font aan.

De bijgeleverde code is een **werkende browserprototype** (vanilla HTML/CSS/JavaScript), niet de echte React Native-app. Voor een webdemo mag deze code vrijwel rechtstreeks worden hergebruikt.

## Ononderhandelbare visuele regels

- Background app: `#F3F3ED`; basistekst: `#101714`; primair accent: `#D8FB59`.
- Donkergroene kaarten, geen standaard blauw dashboard.
- Grote Space Grotesk-koppen met strakke negatieve letterspatiëring; kleinere labels in uppercase met positieve letterspatiëring.
- Afgeronde kaarten van ongeveer 18–24 px en pill-vormen voor tags en marketingknoppen.
- Donkergroen/lime voor de interactieve missie; lichte achtergrond voor de reguliere app.
- Geen nieuwe fotografie, stockiconen, gradients, schaduwen of illustratiestijlen introduceren die niet in de referentie staan.
- Het huidige logo is een **conceptlogo** gebouwd uit tekst en CSS. Zie `DESIGN_SYSTEM.md`; ga niet uit van een ander officieel SVG-bestand.
- Gebruik dezelfde Nederlandse functionele labels; Engelse slogans zijn bewust onderdeel van de sportieve toon.
- Op smartphones vult de app het scherm; het decoratieve toestelmockup en de desktop-marketingkolom verdwijnen.

## Belangrijke functionele grens

De demo simuleert camera-feedback, alarmscheduling, Niet-storen-test en statistieken. Doe niet alsof deze functionaliteit al werkt. De geplande fysio-/trainermodus is een **latere fase**; toon deze eventueel als expliciet aangekondigd concept. Bouw privacy- en medische flows pas na afzonderlijke specificatie en technische/juridische toetsing.

## Acceptatiecriteria

- Alle zeven schermen en genoemde interacties zijn aanwezig.
- Logo, fontfamilies, kleurcodes, marges, cards, iconen, knoppen en schermvolgorde komen overeen met de referentie.
- Elementen overlappen of clippen niet bij gangbare iPhone-resoluties.
- Alarmtijd blijft behouden wanneer dagen, missies of niveau worden gewijzigd.
- De demo-missie kan van 10 squats via bed opmaken en gordijnen open naar een afrondingsscherm worden doorlopen.
- Geen claims over technisch gegarandeerde alarmen of cameradetectie zolang die niet echt zijn geïmplementeerd en getest.

## Aanvullende bestanden

- `DESIGN_SYSTEM.md`: alle kleuren, fonts, maten, logo-opbouw en componentregels.
- `SCREEN_SPECS.md`: alle schermen, content, data en interacties.
- `assets/`: exporteerbare conceptlogo's als SVG. Het HTML/CSS-logo in `prototype/` blijft de nauwkeurigste referentie voor het huidige webontwerp.
