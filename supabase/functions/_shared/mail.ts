// Mailprovider-adapter. Nu Resend; een andere provider implementeert dezelfde interface.
// Geen geheimen in de code: RESEND_API_KEY staat in de function-secrets.

export type Mail = {
  aan: string;
  onderwerp: string;
  html: string;
  tekst: string;
  // Voor marketingmail: one-click afmelden (RFC 8058) via de List-Unsubscribe-headers
  afmeldUrl?: string;
  idempotencyKey?: string;
};

export type VerzendResultaat = { ok: true; id: string | null } | { ok: false; fout: string };

export interface MailProvider {
  naam: string;
  verstuur(mail: Mail): Promise<VerzendResultaat>;
}

export const AFZENDER = 'Mooove <noreply@mooove-app.com>';
export const ANTWOORDADRES = 'hylke@linkandlead.nl';

export function resend(apiKey: string): MailProvider {
  return {
    naam: 'resend',
    async verstuur(mail) {
      const headers: Record<string, string> = {};
      if (mail.afmeldUrl) {
        headers['List-Unsubscribe'] = `<${mail.afmeldUrl}>`;
        headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
      }
      try {
        const antwoord = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...(mail.idempotencyKey ? { 'Idempotency-Key': mail.idempotencyKey } : {}),
          },
          body: JSON.stringify({
            from: AFZENDER,
            to: [mail.aan],
            reply_to: ANTWOORDADRES,
            subject: mail.onderwerp,
            html: mail.html,
            text: mail.tekst,
            headers,
          }),
        });
        const data = (await antwoord.json().catch(() => ({}))) as { id?: string; message?: string };
        if (!antwoord.ok) return { ok: false, fout: `resend_${antwoord.status}` };
        return { ok: true, id: data.id ?? null };
      } catch {
        return { ok: false, fout: 'resend_netwerk' };
      }
    },
  };
}

export const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Eenvoudige, toegankelijke opmaak in de Mooove-huisstijl (licht, met limegroene knop)
export function opmaak(opties: {
  taal: string;
  titel: string;
  alineas: string[];
  knop?: { tekst: string; url: string };
  voet: string;
}): { html: string; tekst: string } {
  const p = opties.alineas
    .map((a) => `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#151F18">${escape(a)}</p>`)
    .join('');
  const knop = opties.knop
    ? `<p style="margin:24px 0"><a href="${escape(opties.knop.url)}" style="display:inline-block;background:#D9F36B;color:#151F18;font-weight:700;text-decoration:none;padding:14px 22px;border-radius:14px">${escape(opties.knop.tekst)}</a></p>`
    : '';
  const html = `<!doctype html><html lang="${escape(opties.taal)}"><body style="margin:0;background:#F3F3ED;font-family:Helvetica,Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:520px;background:#FFFFFF;border-radius:20px" cellpadding="0" cellspacing="0"><tr><td style="padding:32px"><p style="margin:0 0 24px;font-size:22px;font-weight:800;color:#151F18">mooove<span style="color:#9BC13A">.</span></p><h1 style="margin:0 0 16px;font-size:24px;line-height:30px;color:#151F18">${escape(opties.titel)}</h1>${p}${knop}<p style="margin:24px 0 0;font-size:12px;line-height:18px;color:#5F6E60">${escape(opties.voet)}</p></td></tr></table></td></tr></table></body></html>`;
  const tekst = [
    opties.titel,
    '',
    ...opties.alineas.flatMap((a) => [a, '']),
    ...(opties.knop ? [`${opties.knop.tekst}: ${opties.knop.url}`, ''] : []),
    opties.voet,
  ].join('\n');
  return { html, tekst };
}
