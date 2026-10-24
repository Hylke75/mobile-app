# Supabase-instellingen vóór de lancering

Deze instellingen staan in het Supabase-dashboard (project `akxnqxuztrtkquzbrsvx`) en kunnen niet vanuit de code worden gezet.

## Verplicht

- [ ] **E-mailtemplate** — Authentication → Email Templates → _Magic Link_: de tekst moet `{{ .Token }}` bevatten (de app vraagt om een code, niet om een link). Voorbeeld: `Je Mooove-code is {{ .Token }}. Hij is 1 uur geldig.`
- [ ] **Eigen SMTP** — Authentication → SMTP Settings. De ingebouwde mailserver verstuurt maar een paar mails per uur; gebruik bijvoorbeeld Resend, Postmark of je eigen domein (`noreply@linkandlead.nl`).
- [ ] **Rate limit e-mail** — Authentication → Rate Limits: na het instellen van SMTP verhogen naar bijvoorbeeld 30 per uur.

## Aanbevolen

- [ ] **Leaked password protection** — Authentication → Providers → Email → _Prevent use of leaked passwords_ aanzetten (de Supabase-advisor waarschuwt hierover; relevant voor het reviewer-account met wachtwoord).
- [ ] **Auth-verbindingen als percentage** — Project Settings → Database → Connection pooling → Auth: overschakelen van een vast aantal (10) naar een percentage, zodat het meeschaalt bij een groter instance.
- [ ] **Back-ups** — op het gratis plan worden geen back-ups bewaard die je zelf kunt terugzetten. Bij echte gebruikers: Pro-plan met dagelijkse back-ups (en eventueel Point-in-Time Recovery).
- [ ] **Testomgeving** — met _Branching_ (Pro-plan) krijg je een aparte database voor tests, zodat testen nooit echte gebruikersdata raakt. Alternatief: een tweede gratis project voor de `development`- en `preview`-builds (andere `EXPO_PUBLIC_SUPABASE_URL` per EAS-omgeving).

## Al in orde

- RLS staat aan op alle tabellen (`profiles`, `alarms`, `missie_sessies`) met beleid per gebruiker.
- Indexen op `user_id` (en `afgerond_op`) zijn aanwezig; de prestatie-advisor meldt geen ontbrekende indexen.
- Account verwijderen loopt via de Edge Function `delete-account`; alle data verdwijnt via `on delete cascade`.
