import { expect, test, type Page } from '@playwright/test';

// Volledige flow met een echt testaccount. Draait alleen als E2E_EMAIL en E2E_WACHTWOORD
// (GitHub-secrets) gezet zijn; de data van dat account wordt aan het begin gewist.
const URL_SB = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const EMAIL = process.env.E2E_EMAIL;
const WACHTWOORD = process.env.E2E_WACHTWOORD;

test.skip(
  !EMAIL || !WACHTWOORD || !URL_SB,
  'Geen testaccount ingesteld (E2E_EMAIL/E2E_WACHTWOORD)',
);
test.describe.configure({ mode: 'serial' });

type Sessie = {
  access_token: string;
  expires_in: number;
  expires_at?: number;
  user: { id: string };
};
let sessie: Sessie;

async function rest(pad: string, init: RequestInit = {}) {
  return fetch(`${URL_SB}/rest/v1/${pad}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${sessie.access_token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  });
}

test.beforeAll(async () => {
  const antwoord = await fetch(`${URL_SB}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: WACHTWOORD }),
  });
  sessie = await antwoord.json();
  expect(sessie.access_token, 'inloggen met het testaccount').toBeTruthy();
  sessie.expires_at = Math.floor(Date.now() / 1000) + sessie.expires_in;
  const id = sessie.user.id;
  await rest(`alarms?user_id=eq.${id}`, { method: 'DELETE' });
  await rest(`eigen_missies?user_id=eq.${id}`, { method: 'DELETE' });
  // Missie-sessies kunnen bewust niet verwijderd worden (geen DELETE-policy); die blijven staan
  await rest(`profiles?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ voornaam: null, weekdoel: 7, pauze_tot: null }),
  });
});

async function open(page: Page) {
  const ref = new URL(URL_SB).hostname.split('.')[0];
  await page.addInitScript(
    ([sleutel, waarde]) => {
      if (!localStorage.getItem(sleutel)) localStorage.setItem(sleutel, waarde);
      localStorage.setItem('mooove.taal', JSON.stringify('nl'));
    },
    [`sb-${ref}-auth-token`, JSON.stringify(sessie)],
  );
  page.on('dialog', (dialoog) => dialoog.accept());
  await page.goto('/');
}

const tab = (page: Page, naam: string) => page.getByRole('tab', { name: naam }).click();

test('RLS: geen toegang tot data van anderen', async () => {
  const vreemd = await (await rest(`alarms?select=id&user_id=neq.${sessie.user.id}`)).json();
  expect(vreemd).toEqual([]);
  const inbraak = await rest('alarms', {
    method: 'POST',
    body: JSON.stringify({
      user_id: '00000000-0000-0000-0000-000000000001',
      tijd: '07:00',
      dagen: [0],
      niveau: 'Vrij',
      oefeningen: ['Squats'],
    }),
  });
  expect(inbraak.status).toBeGreaterThanOrEqual(400);
});

test('van welkom tot missie, overslaan, joker en herinneringen', async ({ page }) => {
  const fouten: string[] = [];
  page.on('pageerror', (fout) => fouten.push(fout.message));
  await open(page);

  // Welkom en klaarzetten
  await expect(page.getByText('Hoe mogen we je')).toBeVisible({ timeout: 15_000 });
  await page.getByLabel('Voornaam').fill('Testa');
  await page.getByText("Let's go").click();
  await expect(page.getByText('Zet je wekker klaar.')).toBeVisible();
  await page.getByText('Verder', { exact: true }).click();
  await expect(page.getByText('Je eerste Mooove-alarm', { exact: true })).toBeVisible();

  // Alarm maken
  await page.getByLabel('Alarmtijd').fill('06:30');
  await page.getByLabel('Naam van het alarm').fill('Ochtendtest');
  await page.getByLabel('zaterdag').click();
  await page.getByLabel('zondag').click();
  await page.getByText('Flexibel', { exact: true }).click();
  await page.getByText('Alarm opslaan').click();
  await expect(page.getByText(/Je alarm gaat over .* af/)).toBeVisible();

  // Volgende keer overslaan en weer herstellen
  await tab(page, 'Alarmen');
  await expect(page.getByRole('button', { name: 'Ochtendtest om 06:30 bewerken' })).toBeVisible();
  await page.getByText('Volgende overslaan').click();
  await expect(page.getByText(/^Overgeslagen op /)).toBeVisible();
  await page.reload();
  await tab(page, 'Alarmen');
  await expect(page.getByText(/^Overgeslagen op /)).toBeVisible();
  await page.getByText('Toch laten afgaan').click();
  await expect(page.getByText('Volgende overslaan')).toBeVisible();

  // Missie afronden vanaf Vandaag
  await tab(page, 'Vandaag');
  await page.getByText('Start je missie nu').click();
  const klaar = page.getByText('MISSIES KLAAR');
  for (let i = 0; i < 6 && !(await klaar.isVisible()); i++) {
    await page.getByText('Markeer als uitgevoerd').click();
    await page.getByText(/Volgende ronde|Rond missie af/).click();
    await page.waitForTimeout(800);
  }
  await expect(page.getByText('MISSIES KLAAR')).toBeVisible();
  await page.getByText('Terug naar vandaag').click();

  // Voortgang met joker
  await tab(page, 'Progressie');
  await expect(page.getByText('ON FIRE.')).toBeVisible();
  await expect(page.getByText('🃏 Streak-joker')).toBeVisible();
  await expect(page.getByText(/nog een joker|joker is ingezet/)).toBeVisible();

  // Herinneringen bestaan alleen op de telefoon
  await tab(page, 'Profiel');
  await expect(page.getByText('HERINNERINGEN', { exact: true })).toBeVisible();
  await page.getByRole('switch', { name: 'De avond ervoor' }).click();
  await expect(
    page.getByText('Herinneringen werken alleen in de app op je telefoon.'),
  ).toBeVisible();

  // Uitloggen
  await page.getByText('Uitloggen', { exact: true }).click();
  await expect(page.getByText('Stuur mij een code')).toBeVisible();
  expect(fouten).toEqual([]);
});
