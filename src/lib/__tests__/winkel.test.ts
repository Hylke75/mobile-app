/**
 * @jest-environment node
 */
// RevenueCat-webhook: welke Premium-status volgt uit een aankoopgebeurtenis.
import { ALTIJD, besluit } from '../../../supabase/functions/_shared/winkel';

const ID = '3f1d2c4b-5a6e-4f70-8b91-a2b3c4d5e6f7';
const NU = Date.UTC(2026, 9, 29);

it('zet Premium tot de einddatum bij aankoop en verlenging', () => {
  const einde = Date.UTC(2027, 9, 29);
  for (const type of ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION']) {
    expect(besluit({ type, app_user_id: ID, expiration_at_ms: einde }, 'premium', NU)).toEqual({
      soort: 'zet',
      gebruiker: ID,
      premiumTot: new Date(einde).toISOString(),
    });
  }
});

it('Lifetime krijgt geen einddatum', () => {
  expect(besluit({ type: 'NON_RENEWING_PURCHASE', app_user_id: ID }, 'premium', NU)).toMatchObject({
    premiumTot: ALTIJD,
  });
});

it('opzeggen loopt door tot het einde; verlopen beëindigt Premium', () => {
  expect(besluit({ type: 'CANCELLATION', app_user_id: ID }, 'premium', NU).soort).toBe('niets');
  expect(
    besluit({ type: 'EXPIRATION', app_user_id: ID, expiration_at_ms: NU - 1000 }, 'premium', NU),
  ).toMatchObject({ premiumTot: new Date(NU - 1000).toISOString() });
});

it('vindt het account ook via aliassen en negeert andere entitlements', () => {
  expect(
    besluit({ type: 'RENEWAL', app_user_id: '$RCAnonymousID:abc', aliases: [ID] }, 'premium', NU),
  ).toMatchObject({ gebruiker: ID });
  expect(besluit({ type: 'RENEWAL', app_user_id: 'onbekend' }, 'premium', NU).soort).toBe('niets');
  expect(
    besluit(
      { type: 'INITIAL_PURCHASE', app_user_id: ID, entitlement_ids: ['proef'] },
      'premium',
      NU,
    ).soort,
  ).toBe('niets');
});
