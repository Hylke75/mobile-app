# Marketing — implementatiestatus

Bron van de opdracht: `MOOOVE_CLAUDE_CODE_MASTERPROMPT.md` (versie 1.0, 28 oktober 2026).
Laatst bijgewerkt: 28 oktober 2026, na fase 0 (inventarisatie) en fase 1 (fundament).

## 1. Bevestigde stack en bestaande modules (uit de code)

| Onderdeel | Wat er echt is |
|---|---|
| Mobiele app | Expo SDK 58 / React Native / Expo Router in deze repo (`app/`, `src/`). Inloggen via Supabase (e-mailcode, wachtwoord, anoniem). |
| Website | **Statische site**, gegenereerd door `scripts/bouw-site.mjs` (`npm run site`) naar `site/`, gepubliceerd door Vercel (`vercel.json`, geen framework). Zes talen: nl, en, es, de, fr, zh. Geen Next.js. |
| Beheer (admin) | Eén pagina `site/admin/index.html`, gebouwd uit `scripts/site-admin.html`. Inloggen met Supabase; data via de Edge Functions `admin-overzicht` en `admin-actie`; toegang alleen voor `public.admins` (server-side gecontroleerd). Hulpacties in `public.beheer_log`, misbruikrem in `public.misbruikrem`. |
| Database | Supabase Postgres (EU, Frankfurt), migraties in `supabase/migrations/`, RLS op elke tabel. |
| Serverlogica | Supabase Edge Functions (Deno) in `supabase/functions/`. Geen cron/queue in gebruik. |
| Mail | Resend: domein `mooove-app.com` geverifieerd (SPF/DKIM), Supabase Auth verstuurt inlogcodes via Resend-SMTP vanaf `noreply@mooove-app.com`. |
| Wachtlijst | Tabel `wachtlijst` + openbare functie `wachtlijst`. De privacyverklaring belooft: **één bericht bij beschikbaarheid, daarna verwijderen**. |
| Betalen | Fase 1 van het verdienmodel staat in de app (`src/lib/premium.ts`, proef van 14 dagen vanaf het eerste alarm, server-side `start_proef()`), maar **nog geen echte aankopen** (RevenueCat volgt in fase 3 van het verdienmodel). |
| Tests | Jest (`npm test`), Playwright-schermtests op de web-export (`npm run e2e`), ESLint, TypeScript strict. |
| Foutrapporten | Sentry (EU), zonder persoonsgegevens. |

## 2. Afwijkingen en risico's ten opzichte van de specificatie

1. **Geen Next.js / geen API-routes.** De voorgestelde `/api/...`-endpoints worden Edge Functions (`/functions/v1/<naam>` met een `actie` in de body), net als het bestaande beheer. De admin wordt uitgebreid in `scripts/site-admin.html`; er komt geen tweede admin.
2. **Geen cron/queue.** Voor fase 2–3 (uitgaande wachtrij, automations) is `pg_cron` + een Edge Function nodig. Dat moet in het Supabase-dashboard aangezet worden.
3. **De wachtlijst is geen nieuwsbrieflijst.** Die adressen blijven gescheiden (segment `waitlist_one_time_only` = de tabel `wachtlijst`) en worden nooit geïmporteerd.
4. **De wachtlijst-tabel accepteerde geen `zh`.** De database-check stond `zh` niet toe terwijl de site Chinees aanbiedt. Hersteld in de fase 1-migratie.
5. **Proefperiode is al gebouwd in de app.** Start bij het eerste alarm (`profiles.proef_start`, `start_proef()`), eenmalig per account. Een aparte `trial_entitlements`-tabel is daarom niet nodig. Anonieme (gast)accounts kunnen bij herinstallatie opnieuw beginnen; dat wordt in fase 3 van het verdienmodel afgedekt met de gratis Apple-aankoop "14-day Trial" (gekoppeld aan de Apple-ID).
6. **Migraties via de MCP-koppeling lopen vast** op de goedkeuringsvraag. Migraties staan in de repo en worden door de eigenaar in de SQL-editor uitgevoerd (zie "Handmatige handelingen").
7. **Geen individuele open- of kliktracking** (zoals de specificatie voorschrijft). UTM op links naar de site is toegestaan.
8. **AI, social en influencers (fasen 5–6)** vragen externe accounts (TikTok/Meta/YouTube-apps, een AI-sleutel). Die worden pas gebouwd na akkoord; publiceren alleen via officiële API's.

## 3. Fasen en bestanden

| Fase | Inhoud | Bestanden | Status |
|---|---|---|---|
| 0 | Inventarisatie, dit document | `docs/marketing/IMPLEMENTATION_STATUS.md` | ✅ |
| 1 | Datamodel contacten/consent/suppressie/instellingen/auditlog/events, rollen; nieuwsbriefaanmelding met dubbele bevestiging en afmelden; contacten in het beheer; formulier op de site | `supabase/migrations/20261028140000_marketing_fundament.sql`, `supabase/functions/_shared/marketing.ts` (+ tests in `src/lib/__tests__/marketing.test.ts`), `supabase/functions/_shared/mail.ts`, `supabase/functions/nieuwsbrief/`, `supabase/functions/admin-marketing/`, `scripts/site-admin.html`, `scripts/site-landing.mjs`, `scripts/site-teksten.mjs`, `scripts/bouw-site.mjs`, `src/i18n/teksten/privacy.ts`, `docs/store/privacyverklaring.md` | ✅ code — wacht op migratie + deploy |
| 2 | Nieuwsbriefmodule: campagnes, blok-editor, sjablonen, preview, testmail, goedkeuring, inplannen, outbox + worker, Resend-webhooks, zes concepten "The Morning MOOOVE" | nieuwe migratie, functies `admin-nieuwsbrief`, `mail-worker`, `mail-webhook`, admin-schermen | gepland |
| 3 | 14-dagenfunnel: events uit de app, flows D0–D17, stopregels (`canSendMarketing`), testklok; koppeling met echte aankopen | migratie, functies, app-events | gepland (hangt af van aankopen) |
| 4 | Groeidashboard: KPI's, cohorten, UTM, MRR en Lifetime apart | `admin-overzicht`, admin | gepland |
| 5 | Socialkalender, exportpakketten, creators/referral | migratie, admin | gepland |
| 6 | AI Content Studio (alleen concepten) | functie + admin | gepland |
| 7 | Hardening en lanceringschecklist | docs, tests | gepland |

## 4. Externe afhankelijkheden en handmatige handelingen (eigenaar)

- **Migratie uitvoeren** in de Supabase SQL-editor: `supabase/migrations/20261028140000_marketing_fundament.sql` (en eerder al `20261028120000_premium.sql`).
- **Edge Functions deployen**: `nieuwsbrief` (zonder JWT-controle, openbaar) en `admin-marketing`. Claude Code kan dit doen na goedkeuring.
- **Function-secrets** in Supabase (Project Settings → Edge Functions → Secrets):
  - `RESEND_API_KEY` — een Resend-sleutel met alleen verzendrecht voor `mooove-app.com`.
  - `MARKETING_TOKEN_SECRET` — een lange willekeurige tekst (voor afmeld-links).
  - `MARKETING_SITE_URL` — `https://www.mooove-app.com`.
- **Verzendmodus** staat standaard op `disabled` (er gaat niets de deur uit). Voor testen: in het beheer op `test` zetten en testadressen toevoegen. `live` alleen door de eigenaar.
- **DMARC**: voeg in TransIP een TXT-record `_dmarc.mooove-app.com` toe met `v=DMARC1; p=none; rua=mailto:hylke@linkandlead.nl` (later aanscherpen naar `quarantine`).
- **Juridische teksten**: de toestemmingstekst en de aangepaste privacyverklaring moeten door de eigenaar worden nagelezen.

## 5. Test- en rollbackstrategie

- Pure logica (e-mailnormalisatie, tokens, consentstatus, `canSendMarketing`) staat in `supabase/functions/_shared/marketing.ts` zonder Deno-afhankelijkheden en wordt met Jest getest.
- Migraties zijn **additief** (nieuwe tabellen, één verruimde check). Terugdraaien: de nieuwe `marketing_*`-tabellen droppen; de rest van de app gebruikt ze niet.
- Alles wat mail verstuurt, controleert de verzendmodus (`disabled` / `test` / `live`) én de toestemming vlak voor verzending. Standaard `disabled`.
- `src/lib/__tests__/nieuwsbriefSite.test.ts` controleert op de gebouwde site (alle zes talen) dat het nieuwsbriefformulier los staat van de wachtlijst, een niet-aangevinkt toestemmingsvakje heeft en precies de tekst toont die als bewijs wordt opgeslagen.
- De Edge Functions zijn met `deno check` gecontroleerd; het Marketing-tabblad in het beheer is met nepdata in de browser getest (geen consolefouten).

## Fase 1 — overzicht

FASE: 1 — fundament (consent, aanmelden, contacten)
GEREED: zie tabel hierboven; dubbele bevestiging, afmelden zonder login, suppressies, auditlog, verzendmodus.
TESTS: `npm test` (161 tests, waarvan 28 voor marketing), `npm run lint`, `npm run typecheck`, `npm run site`, `npm run e2e`, `deno check` op beide functies — alles groen.
CONFIGURATIE DIE HYLKE NOG MOET DOEN: zie sectie 4.
RISICO'S/OPEN PUNTEN: geen cron (nodig vanaf fase 2); juridische tekst nalezen.
VOLGENDE FASE: 2 — nieuwsbriefmodule.
