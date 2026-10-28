/**
 * @jest-environment node
 */
// Nieuwsbrief (Edge Functions): blokken, opmaak, controles, herhaalschema en webhookcontrole.
import {
  controleer,
  controleerWebhook,
  leesResendEvent,
  maakMail,
  metUtm,
  schoonBlokken,
  veiligeUrl,
  volgendePoging,
  welkomCampagne,
  type Campagne,
} from '../../../supabase/functions/_shared/nieuwsbrief';

const basis: Campagne = {
  naam: 'Stop snooze',
  taal: 'nl',
  onderwerp: 'Waarom de snoozeknop je ochtend kaapt',
  preheader: 'En wat je morgen anders kunt doen.',
  blokken: [
    { type: 'titel', tekst: 'Stop met snoozen' },
    { type: 'alinea', tekst: 'Eerste alinea.\n\nTweede alinea.' },
    { type: 'knop', tekst: 'Ontdek Mooove', url: 'https://www.mooove-app.com/' },
  ],
};

describe('blokken', () => {
  it('laat alleen bekende blokken en https-links door', () => {
    const blokken = schoonBlokken([
      { type: 'titel', tekst: 'Hoi' },
      { type: 'script', tekst: 'alert(1)' },
      { type: 'knop', tekst: 'Klik', url: 'javascript:alert(1)' },
      null,
    ]);
    expect(blokken.map((b) => b.type)).toEqual(['titel', 'knop']);
    expect(veiligeUrl('javascript:alert(1)')).toBeNull();
    expect(veiligeUrl('http://mooove-app.com')).toBeNull();
    expect(veiligeUrl('https://www.mooove-app.com/en/')).toBe('https://www.mooove-app.com/en/');
  });

  it('zet UTM alleen op links naar de eigen site', () => {
    expect(metUtm('https://www.mooove-app.com/', 'stop')).toContain('utm_campaign=stop');
    expect(metUtm('https://example.com/', 'stop')).toBe('https://example.com/');
  });
});

describe('maakMail', () => {
  it('ontsnapt alle tekst en heeft altijd een afmeldlink en tekstversie', () => {
    const mail = maakMail(
      {
        ...basis,
        blokken: [{ type: 'alinea', tekst: '<script>alert(1)</script>' }, ...basis.blokken],
      },
      { afmeldUrl: 'https://www.mooove-app.com/nieuwsbrief/afmelden#t=abc' },
    );
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
    expect(mail.html).toContain('nieuwsbrief/afmelden#t=abc');
    expect(mail.html).toContain('Afmelden');
    expect(mail.tekst).toContain('Afmelden: https://www.mooove-app.com/nieuwsbrief/afmelden#t=abc');
    expect(mail.html).toContain('utm_source=newsletter');
    expect(mail.onderwerp).toBe(basis.onderwerp);
  });

  it('markeert testmails zichtbaar', () => {
    const mail = maakMail(basis, { afmeldUrl: 'https://x.nl/a', test: true });
    expect(mail.onderwerp.startsWith('[TEST] ')).toBe(true);
    expect(mail.html).toContain('TEST');
    expect(mail.tekst.startsWith('[TEST')).toBe(true);
  });

  it('maakt een welkomstmail in elke taal', () => {
    for (const taal of ['nl', 'en', 'es', 'de', 'fr', 'zh'] as const) {
      const c = welkomCampagne(taal, 'https://www.mooove-app.com');
      expect(controleer(c).fouten).toEqual([]);
      expect(maakMail(c, { afmeldUrl: 'https://x.nl/a' }).html).toContain(`lang="${taal}"`);
    }
  });
});

describe('controleer', () => {
  it('keurt een volledige nieuwsbrief goed', () => {
    expect(controleer(basis)).toEqual({ fouten: [], waarschuwingen: [] });
  });

  it('blokkeert lege inhoud, onveilige links en afbeeldingen zonder alt-tekst', () => {
    const { fouten } = controleer({
      ...basis,
      onderwerp: '',
      blokken: [
        { type: 'knop', tekst: 'Klik', url: 'http://example.com' },
        { type: 'afbeelding', url: 'https://www.mooove-app.com/a.png', alt: '' },
      ],
    });
    expect(fouten).toEqual(
      expect.arrayContaining([
        'Onderwerp ontbreekt',
        'Blok 1: de link moet met https:// beginnen',
        'Blok 2: alt-tekst ontbreekt (voor schermlezers)',
      ]),
    );
  });

  it('waarschuwt voor spamachtige teksten', () => {
    const { waarschuwingen } = controleer({ ...basis, onderwerp: 'GRATIS!! Klik hier' });
    expect(waarschuwingen.length).toBeGreaterThan(0);
  });
});

describe('volgendePoging', () => {
  it('wacht steeds langer en stopt na vijf pogingen', () => {
    const nu = 0;
    expect(volgendePoging(1, nu)?.getTime()).toBe(2 * 60_000);
    expect(volgendePoging(4, nu)?.getTime()).toBe(16 * 60_000);
    expect(volgendePoging(5, nu)).toBeNull();
  });
});

describe('webhooks', () => {
  const geheim = 'whsec_' + btoa('supergeheime-sleutel-123');
  const body = JSON.stringify({ type: 'email.bounced', data: { email_id: 'abc' } });

  async function teken(id: string, tijd: string) {
    const sleutel = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('supergeheime-sleutel-123'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const mac = new Uint8Array(
      await crypto.subtle.sign('HMAC', sleutel, new TextEncoder().encode(`${id}.${tijd}.${body}`)),
    );
    return `v1,${btoa(String.fromCharCode(...mac))}`;
  }

  it('accepteert alleen een geldige, recente handtekening', async () => {
    const nu = 1_800_000_000_000;
    const tijd = String(nu / 1000);
    const handtekening = await teken('msg_1', tijd);
    const opties = { id: 'msg_1', tijdstip: tijd, handtekening, body, geheim, nu };
    expect(await controleerWebhook(opties)).toBe(true);
    expect(await controleerWebhook({ ...opties, body: body + ' ' })).toBe(false);
    expect(await controleerWebhook({ ...opties, geheim: 'whsec_' + btoa('ander') })).toBe(false);
    expect(await controleerWebhook({ ...opties, nu: nu + 10 * 60_000 })).toBe(false);
    expect(await controleerWebhook({ ...opties, handtekening: null })).toBe(false);
  });

  it('herkent harde en zachte bounces en klachten', () => {
    expect(leesResendEvent(JSON.parse(body))).toMatchObject({
      type: 'bounced',
      hard: true,
      berichtId: 'abc',
    });
    expect(
      leesResendEvent({ type: 'email.bounced', data: { bounce: { type: 'Transient' } } }).hard,
    ).toBe(false);
    expect(leesResendEvent({ type: 'email.complained', data: {} }).type).toBe('complained');
    expect(leesResendEvent({ type: 'email.opened' }).type).toBe('other');
  });
});
