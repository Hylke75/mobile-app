# Nieuwsbrief — werkwijze

Nieuwsbrief: **The Morning MOOOVE**, ongeveer om de twee weken (instelling
`newsletter_frequency_days`). Alles gebeurt in Beheer → Marketing → Nieuwsbrieven.

## Wie mag wat

| Rol | Concepten maken/bewerken | Testmail | Goedkeuren | Inplannen/pauzeren/annuleren | Live zetten |
|---|---|---|---|---|---|
| owner | ✓ | ✓ | ✓ | ✓ | ✓ (typ LIVE) |
| admin | ✓ | ✓ | ✓ | ✓ | – |
| marketing_editor | ✓ | ✓ | – | – | – |
| analyst | alleen lezen | – | – | – | – |

## Levenscyclus

`draft` → `in_review` (indienen) → `approved` (goedkeuren) → `scheduled` (inplannen: nu of later)
→ `sending` → `completed`. Vanuit `scheduled`/`sending` kan **Pauzeren** (`paused`) en weer
**Hervatten**; **Annuleren** kan altijd tot de verzending klaar is. Elke wijziging na goedkeuring
zet de nieuwsbrief terug naar concept. Elke stap staat in het auditlog.

## Maken

1. **Nieuwe nieuwsbrief** (kies de taal) of **Dupliceren** van een bestaande. Zes concepten staan
   klaar in NL en EN.
2. Vul interne naam, onderwerp (liefst ≤ 60 tekens), preheader en doelgroep (talen) in.
3. Bouw de inhoud met vaste blokken: titel, alinea, knop, afbeelding (https + alt-tekst verplicht),
   twee kolommen, scheidingslijn, handtekening. Logo en voettekst met afmeldlink komen er
   automatisch bij. HTML of scripts invoegen kan niet.
4. Het voorbeeld (mobiel/desktop) en de controle (fouten en waarschuwingen) worden live bijgewerkt.
   Met fouten kun je niet indienen of goedkeuren.

## Testen

- Zet de verzendmodus op **Test** en vul testadressen in (max. 10).
- **Testmail** stuurt de nieuwsbrief met `[TEST]` in het onderwerp en een gele TEST-balk alleen naar
  de testadressen, ook als de modus Live is.
- Een ingeplande campagne in testmodus gaat alleen naar ontvangers die ook testadres zijn; de rest
  wordt overgeslagen (`not_test_recipient`) en krijgt hem later niet alsnog.

## Verzenden

- Inplannen toont vooraf het aantal ontvangers en de verzendmodus en vraagt om bevestiging.
- Op het verzendmoment bepaalt de worker de doelgroep: alleen contacten met **bevestigde**
  nieuwsbrieftoestemming in de gekozen talen. De wachtlijst hoort er nooit bij.
- Vlak vóór elke mail wordt opnieuw gecontroleerd: verzendmodus, noodstop, toestemming,
  afmelding/bounce/klacht/verwijderverzoek en of de campagne nog loopt.
- Verzendmodus Uit of noodstop aan: mails blijven in de wachtrij en worden later opnieuw
  geprobeerd. Een mislukte verzending wordt na 2, 4, 8 en 16 minuten herhaald en daarna `dead`.
- Elke mail heeft een idempotentiesleutel, dus een ontvanger krijgt een campagne nooit twee keer.

## Afbreken

- **Pauzeren**: er worden geen nieuwe mails meer opgepakt; **Hervatten** gaat verder waar hij was.
- **Annuleren**: openstaande mails worden geannuleerd.
- **Noodstop** (Marketing → Verzendinstellingen): blokkeert direct alle marketingmail.

## Afmelden, bounces en klachten

- Elke mail heeft een afmeldlink (pagina op de site) en one-click afmelden via de
  `List-Unsubscribe`-header. Afmelden annuleert ook al ingeplande mails.
- Resend meldt bounces en klachten via de webhook: een permanente bounce of klacht blokkeert het
  adres voor alle mail.
- Resultaten per campagne: in de wachtrij, verstuurd, bezorgd, overgeslagen, mislukt, bounce,
  klacht. Opens en kliks per persoon meten we niet.

## Welkomstmail

Na de dubbele bevestiging komt een welkomstmail in de wachtrij. Die volgt dezelfde regels als elke
marketingmail (verzendmodus, noodstop, toestemming).
