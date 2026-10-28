# Marketing — installatie en configuratie

Alles draait in Supabase (database + Edge Functions) en de statische site op Vercel. Geheimen staan
alleen in de function-secrets van Supabase (Project Settings → Edge Functions → Secrets), nooit in de
repo of in de browser.

## 1. Migraties (SQL-editor, in deze volgorde)

1. `supabase/migrations/20261028120000_premium.sql`
2. `supabase/migrations/20261028140000_marketing_fundament.sql`
3. `supabase/migrations/20261029100000_nieuwsbrief_module.sql` (maakt ook de zes concepten aan)

Alle migraties zijn additief. Terugdraaien: de nieuwe tabellen `newsletter_*`, `email_*` en
`marketing_*` droppen; de app gebruikt ze niet.

## 2. Function-secrets

| Secret | Waarde | Gebruikt door |
|---|---|---|
| `RESEND_API_KEY` | Resend-sleutel met alleen verzendrecht voor `mooove-app.com` | nieuwsbrief, admin-nieuwsbrief, mail-worker |
| `MARKETING_TOKEN_SECRET` | lange willekeurige tekst (bijv. `openssl rand -base64 48`) | afmeldlinks |
| `MARKETING_SITE_URL` | `https://www.mooove-app.com` | links in mails |
| `MARKETING_CRON_SECRET` | lange willekeurige tekst | mail-worker (cron) |
| `RESEND_WEBHOOK_SECRET` | `whsec_…` uit Resend → Webhooks | mail-webhook |

Zonder `RESEND_API_KEY` of `MARKETING_TOKEN_SECRET` blijft marketingmail in de wachtrij staan
(er gaat dan nooit mail zonder afmeldlink de deur uit).

## 3. Edge Functions

| Functie | JWT-controle | Doel |
|---|---|---|
| `nieuwsbrief` | uit (openbaar, misbruikrem) | aanmelden, bevestigen, afmelden |
| `admin-marketing` | aan | contacten, toestemming, verzendinstellingen |
| `admin-nieuwsbrief` | aan | campagnes, voorbeeld, testmail, goedkeuren, inplannen, wachtrij |
| `mail-worker` | uit (eigen geheim `x-cron-secret`) | verzendwachtrij verwerken |
| `mail-webhook` | uit (Svix-handtekening) | bezorgmeldingen van Resend |

## 4. Cron: elke minuut de wachtrij verwerken

Zet in Database → Extensions `pg_cron` en `pg_net` aan. Voer daarna in de SQL-editor uit (vervang
`<HETZELFDE GEHEIM ALS MARKETING_CRON_SECRET>`; het staat dan versleuteld in Vault):

```sql
select vault.create_secret('<HETZELFDE GEHEIM ALS MARKETING_CRON_SECRET>', 'marketing_cron_secret');

select cron.schedule(
  'mooove-mail-worker',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://akxnqxuztrtkquzbrsvx.supabase.co/functions/v1/mail-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'marketing_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Stoppen: `select cron.unschedule('mooove-mail-worker');`. Zonder cron kan de wachtrij ook met de
knop **Wachtrij nu verwerken** in het beheer worden verwerkt.

## 5. Resend-webhook

Resend → Webhooks → Add endpoint:

- URL: `https://akxnqxuztrtkquzbrsvx.supabase.co/functions/v1/mail-webhook`
- Events: `email.sent`, `email.delivered`, `email.bounced`, `email.complained`, `email.delivery_delayed`
- Kopieer de signing secret (`whsec_…`) naar `RESEND_WEBHOOK_SECRET`.

Opens en clicks staan uit: we meten geen individuele opens of kliks.

## 6. DNS (TransIP)

SPF en DKIM voor `mooove-app.com` zijn al geverifieerd in Resend. Voeg nog DMARC toe:

- TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:hylke@linkandlead.nl`

Na een paar weken zonder problemen aanscherpen naar `p=quarantine`.

## 7. Verzendmodus

`marketing_settings.send_mode` staat standaard op `disabled`. Testen: Beheer → Marketing →
Verzendinstellingen → **Test** en testadressen invullen. **Live** kan alleen de eigenaar (rol
`owner`), met getypte bevestiging, en wordt in het auditlog vastgelegd.
