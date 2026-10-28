/**
 * @jest-environment node
 */
// Marketing (Edge Functions): e-mailnormalisatie, tokens, toestemming en de verzendcontrole.
import {
  consentStatus,
  controleerAfmeldToken,
  magOpnieuwAanmelden,
  magVersturen,
  maakToken,
  normaliseerEmail,
  sha256,
  tekenAfmeldToken,
  type VerzendContext,
} from '../../../supabase/functions/_shared/marketing';

const ID = '3f1d2c4b-5a6e-4f70-8b91-a2b3c4d5e6f7';

describe('normaliseerEmail', () => {
  it('maakt adressen eenduidig en weigert ongeldige invoer', () => {
    expect(normaliseerEmail('  Hylke@Example.COM ')).toBe('hylke@example.com');
    expect(normaliseerEmail('geen-adres')).toBeNull();
    expect(normaliseerEmail(42)).toBeNull();
    expect(normaliseerEmail(`${'a'.repeat(250)}@x.nl`)).toBeNull();
  });
});

describe('tokens', () => {
  it('maakt lange, unieke tokens en hasht ze stabiel', async () => {
    const a = maakToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(maakToken()).not.toBe(a);
    expect(await sha256('x')).toBe(await sha256('x'));
  });

  it('accepteert alleen afmeldlinks met de juiste handtekening', async () => {
    const token = await tekenAfmeldToken(ID, 'geheim');
    expect(await controleerAfmeldToken(token, 'geheim')).toBe(ID);
    expect(await controleerAfmeldToken(token, 'ander-geheim')).toBeNull();
    expect(await controleerAfmeldToken(`${ID}.vervalst`, 'geheim')).toBeNull();
    expect(await controleerAfmeldToken('onzin', 'geheim')).toBeNull();
    expect(await controleerAfmeldToken(token, '')).toBeNull();
  });
});

describe('consentStatus', () => {
  const rij = (status: 'pending' | 'granted' | 'revoked', minuut: number) => ({
    status,
    created_at: new Date(2026, 9, 28, 10, minuut).toISOString(),
  });

  it('volgt de laatste beslissing', () => {
    expect(consentStatus([])).toBe('none');
    expect(consentStatus([rij('pending', 1)])).toBe('pending');
    expect(consentStatus([rij('pending', 1), rij('granted', 2)])).toBe('granted');
    expect(consentStatus([rij('granted', 2), rij('revoked', 3)])).toBe('revoked');
  });

  it('een nieuwe aanmelding na afmelden is pending tot bevestiging', () => {
    expect(consentStatus([rij('granted', 1), rij('revoked', 2), rij('pending', 3)])).toBe(
      'pending',
    );
    // Opnieuw aanmelden terwijl je al toestemming gaf, verandert niets
    expect(consentStatus([rij('granted', 1), rij('pending', 2)])).toBe('granted');
  });
});

describe('magVersturen', () => {
  const basis: VerzendContext = {
    soort: 'marketing',
    email: 'a@b.nl',
    consent: 'granted',
    suppressies: [],
    sendMode: 'live',
    killSwitch: false,
    testontvangers: [],
  };

  it('verstuurt niets zolang de verzendmodus uit staat', () => {
    expect(magVersturen({ ...basis, sendMode: 'disabled' })).toEqual({
      ok: false,
      reden: 'send_mode_disabled',
    });
  });

  it('stuurt in testmodus alleen naar testadressen', () => {
    expect(magVersturen({ ...basis, sendMode: 'test' }).ok).toBe(false);
    expect(magVersturen({ ...basis, sendMode: 'test', testontvangers: ['a@b.nl'] }).ok).toBe(true);
  });

  it('vereist toestemming voor marketing, niet voor de bevestigingsmail', () => {
    expect(magVersturen({ ...basis, consent: 'pending' }).ok).toBe(false);
    expect(magVersturen({ ...basis, consent: 'none', soort: 'transactional' }).ok).toBe(true);
  });

  it('respecteert afmelden, bounces, klachten en de noodstop', () => {
    const met = (reason: 'unsubscribe' | 'hard_bounce' | 'spam_complaint') => ({
      ...basis,
      suppressies: [{ reason, scope: 'marketing' as const }],
    });
    expect(magVersturen(met('unsubscribe')).ok).toBe(false);
    expect(magVersturen({ ...met('unsubscribe'), soort: 'transactional' }).ok).toBe(true);
    expect(magVersturen({ ...met('hard_bounce'), soort: 'transactional' }).ok).toBe(false);
    expect(magVersturen({ ...met('spam_complaint'), soort: 'transactional' }).ok).toBe(false);
    expect(magVersturen({ ...basis, killSwitch: true })).toEqual({
      ok: false,
      reden: 'kill_switch',
    });
  });
});

describe('magOpnieuwAanmelden', () => {
  it('na afmelden wel, na een bounce, klacht of verwijderverzoek niet', () => {
    expect(magOpnieuwAanmelden(['unsubscribe'])).toBe(true);
    expect(magOpnieuwAanmelden(['hard_bounce'])).toBe(false);
    expect(magOpnieuwAanmelden(['spam_complaint'])).toBe(false);
    expect(magOpnieuwAanmelden(['deletion_request'])).toBe(false);
  });
});
