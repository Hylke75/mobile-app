import { expect, test } from '@playwright/test';

// Schermen zonder account: werken ook zonder Supabase-gegevens in de controle
test.describe('zonder inloggen', () => {
  test('inlogscherm met code en wachtwoord', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Stuur mij een code')).toBeVisible();
    // Apple-richtlijn 5.1.1(v): de app is ook zonder account te gebruiken
    await expect(page.getByRole('button', { name: 'Doorgaan zonder account' })).toBeVisible();
    await page.getByText('Inloggen met wachtwoord', { exact: true }).click();
    await expect(page.getByLabel('Wachtwoord')).toBeVisible();
  });

  test('privacyverklaring is bereikbaar zonder account', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Privacyverklaring', { exact: true }).click();
    await expect(page.getByText('Welke gegevens verwerken we?')).toBeVisible();
    await page.getByText('Terug', { exact: true }).click();
    await expect(page.getByText('Stuur mij een code')).toBeVisible();
  });

  for (const [taal, knop] of [
    ['en', 'Send me a code'],
    ['es', 'Envíame un código'],
    ['de', 'Schick mir einen Code'],
    ['fr', 'Envoie-moi un code'],
    ['zh', '给我发验证码'],
  ] as const) {
    test(`inlogscherm in het ${taal}`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('mooove.taal', JSON.stringify(t)), taal);
      await page.goto('/');
      await expect(page.getByText(knop)).toBeVisible();
    });
  }

  test('geen fouten in de console bij het opstarten', async ({ page }) => {
    const fouten: string[] = [];
    page.on('pageerror', (fout) => fouten.push(fout.message));
    await page.goto('/');
    await expect(page.getByText('Stuur mij een code')).toBeVisible();
    expect(fouten).toEqual([]);
  });
});
