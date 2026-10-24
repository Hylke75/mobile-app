# Back-ups en herstel

Alle gebruikersgegevens staan in Supabase (project `akxnqxuztrtkquzbrsvx`). Op het toestel
staat alleen een cache; die is geen back-up.

## Wat Supabase bewaart

| Plan       | Back-ups                                       | Herstel                      |
| ---------- | ---------------------------------------------- | ---------------------------- |
| Free       | Geen downloadbare back-ups                     | Niet mogelijk via dashboard  |
| Pro        | Dagelijks, 7 dagen bewaard                     | Database → Backups → Restore |
| Pro + PITR | Point-in-time, op de seconde (add-on, 7–28 d.) | Kies een tijdstip            |

Advies voor de livegang: **Pro-plan**. PITR pas aanzetten bij veel gebruikers; een dag aan
missies verliezen is vervelend, maar niet ernstig.

Niet in de database-back-up: Edge Functions (staan in `supabase/functions/`), secrets van
Edge Functions, auth-instellingen en e-mailtemplates (staan in `docs/supabase-instellingen.md`).

## Eigen extra back-up (wekelijks, aanbevolen)

Met de Supabase CLI en het databasewachtwoord (Project Settings → Database):

```bash
supabase db dump --db-url "$DATABASE_URL" -f schema.sql
supabase db dump --db-url "$DATABASE_URL" --data-only -f data.sql
supabase db dump --db-url "$DATABASE_URL" --role-only -f rollen.sql
```

Bewaar de bestanden versleuteld buiten Supabase (ze bevatten e-mailadressen) en verwijder ze
na 30 dagen, zoals in de privacyverklaring staat.

## Hersteloefening (eens per kwartaal)

1. Maak een nieuw, leeg Supabase-project `mooove-hersteltest` (zelfde regio).
2. Zet schema en data terug:
   ```bash
   psql "$TEST_DATABASE_URL" -f rollen.sql
   psql "$TEST_DATABASE_URL" -f schema.sql
   psql "$TEST_DATABASE_URL" -c "set session_replication_role = replica" -f data.sql
   ```
3. Controleer:
   - aantallen in `profiles`, `alarms`, `missie_sessies`, `eigen_missies` en `feedback`
     komen overeen met productie;
   - RLS staat aan op elke tabel (`select relname from pg_class where relrowsecurity = false
and relnamespace = 'public'::regnamespace and relkind = 'r';` geeft niets);
   - een testaccount kan met een development-build (tijdelijk `EXPO_PUBLIC_SUPABASE_URL` naar
     het testproject) inloggen en zijn alarmen zien.
4. Noteer datum, duur en bijzonderheden hieronder en verwijder het testproject.

| Datum | Duur | Resultaat |
| ----- | ---- | --------- |
|       |      |           |

## Bij een incident

1. Zet de app niet uit: alarmen werken offline door, missies wachten in de wachtrij.
2. Herstel via Database → Backups (of PITR naar vlak vóór het incident).
3. Het herstel overschrijft wijzigingen na dat moment; missies uit de wachtrij van toestellen
   komen daarna vanzelf weer binnen.
4. Bij een datalek: binnen 72 uur melden bij de Autoriteit Persoonsgegevens.
