// Bouwt de hele site in zes talen (Nederlands op /, de rest onder /en, /es, /de, /fr, /zh):
// presentatiepagina, privacyverklaring (uit src/i18n/teksten/privacy.ts) en account verwijderen.
// Gebruik: npm run site
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { privacy } from '../src/i18n/teksten/privacy.ts';
import { CSS, FAVICON, HREFLANG, landing, navigatie, voettekst } from './site-landing.mjs';
import { LANDING } from './site-teksten.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HIER, '..', 'site');
const BIJGEWERKT = new Date(2026, 9, 25);
const MAIL = 'hylke@linkandlead.nl';
export const DOMEIN = 'https://www.mooove-app.com';
const TALEN = ['nl', 'en', 'es', 'de', 'fr', 'zh'];
const TAALNAMEN = {
  nl: 'Nederlands',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  zh: '中文',
};
const LOCALES = { nl: 'nl-NL', en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', zh: 'zh-CN' };

const TEKST = {
  nl: {
    beschrijving: 'Mooove — de wekker die pas stopt als je in beweging bent.',
    privacy: 'Privacyverklaring',
    verwijderen: 'Account verwijderen',
    kickerAccount: 'ACCOUNT',
    kolomGegeven: 'Gegeven',
    kolomWaarvoor: 'Waarvoor',
    verwijderTitel: 'Je Mooove-account verwijderen',
    verwijderIntro:
      'Je kunt je account en alle bijbehorende gegevens op twee manieren verwijderen.',
    inApp: 'In de app (direct)',
    stappen: [
      'Open Mooove en ga naar <strong>Profiel</strong>.',
      'Tik onder <strong>Account</strong> op <strong>Account verwijderen</strong>.',
      'Bevestig. Je account, alarmen en voortgang worden direct en definitief verwijderd.',
    ],
    zonderApp: 'Zonder de app',
    zonderAppTekst: `Heb je de app niet meer? Stuur een e-mail naar <strong>${MAIL}</strong> met als onderwerp &quot;Account verwijderen&quot; vanaf het e-mailadres waarmee je bent ingelogd. We verwijderen je account en alle gegevens binnen 30 dagen en bevestigen dit per e-mail.`,
    watTitel: 'Wat wordt verwijderd?',
    watTekst:
      'Alles: je e-mailadres, voornaam, alarmen, eigen missies, missieresultaten en instellingen. We bewaren geen kopie.',
  },
  zh: {
    beschrijving: 'Mooove — 只有动起来才会停的闹钟。',
    privacy: '隐私政策',
    verwijderen: '删除账户',
    kickerAccount: '账户',
    kolomGegeven: '数据',
    kolomWaarvoor: '用途',
    verwijderTitel: '删除你的 Mooove 账户',
    verwijderIntro: '你可以通过两种方式删除账户及所有相关数据。',
    inApp: '在应用中（立即生效）',
    stappen: [
      '打开 Mooove，进入<strong>我的</strong>。',
      '点按<strong>删除账户</strong>。',
      '确认。你的账户、闹钟和进度会立即永久删除。',
    ],
    zonderApp: '不使用应用',
    zonderAppTekst: `已经没有这个应用了？请用你登录时使用的邮箱地址发送邮件至 <strong>${MAIL}</strong>，主题为&quot;删除账户&quot;。我们会在 30 天内删除你的账户和所有数据，并通过邮件确认。`,
    watTitel: '会删除哪些内容？',
    watTekst: '全部：你的邮箱地址、名字、闹钟、自定义任务、任务结果和设置。我们不会保留任何副本。',
  },
  en: {
    kickerAccount: 'ACCOUNT',
    kolomGegeven: 'Data',
    kolomWaarvoor: 'What for',
    beschrijving: 'Mooove — the alarm clock that only stops once you are moving.',
    privacy: 'Privacy policy',
    verwijderen: 'Delete account',
    taal: 'Language',
    intro:
      'Mooove is the alarm clock that only stops once you are really moving. Choose your missions — squats, push-ups, making your bed or opening the curtains — and start every day strong.',
    camera: 'Camera images are processed only on your own phone and are never stored or sent.',
    contact: 'Contact',
    verwijderTitel: 'Delete your Mooove account',
    verwijderIntro: 'You can delete your account and all associated data in two ways.',
    inApp: 'In the app (immediately)',
    stappen: [
      'Open Mooove and go to <strong>Profile</strong>.',
      'Tap <strong>Delete account</strong>.',
      'Confirm. Your account, alarms and progress are deleted immediately and permanently.',
    ],
    zonderApp: 'Without the app',
    zonderAppTekst: `No longer have the app? Send an email to <strong>${MAIL}</strong> with the subject &quot;Delete account&quot; from the email address you signed in with. We will delete your account and all data within 30 days and confirm this by email.`,
    watTitel: 'What is deleted?',
    watTekst:
      'Everything: your email address, first name, alarms, custom missions, mission results and settings. We do not keep a copy.',
  },
  es: {
    kickerAccount: 'CUENTA',
    kolomGegeven: 'Dato',
    kolomWaarvoor: 'Para qué',
    beschrijving: 'Mooove: el despertador que solo se detiene cuando te pones en marcha.',
    privacy: 'Política de privacidad',
    verwijderen: 'Eliminar cuenta',
    taal: 'Idioma',
    intro:
      'Mooove es el despertador que solo se detiene cuando de verdad te has puesto en marcha. Elige tus misiones —sentadillas, flexiones, hacer la cama o abrir las cortinas— y empieza cada día con fuerza.',
    camera:
      'Las imágenes de la cámara se procesan solo en tu propio teléfono y nunca se guardan ni se envían.',
    contact: 'Contacto',
    verwijderTitel: 'Eliminar tu cuenta de Mooove',
    verwijderIntro: 'Puedes eliminar tu cuenta y todos los datos asociados de dos maneras.',
    inApp: 'En la app (al instante)',
    stappen: [
      'Abre Mooove y ve a <strong>Perfil</strong>.',
      'Toca <strong>Eliminar cuenta</strong>.',
      'Confirma. Tu cuenta, tus alarmas y tu progreso se eliminan al instante y de forma definitiva.',
    ],
    zonderApp: 'Sin la app',
    zonderAppTekst: `¿Ya no tienes la app? Envía un correo a <strong>${MAIL}</strong> con el asunto &quot;Eliminar cuenta&quot; desde la dirección con la que iniciaste sesión. Eliminaremos tu cuenta y todos tus datos en un plazo de 30 días y te lo confirmaremos por correo.`,
    watTitel: '¿Qué se elimina?',
    watTekst:
      'Todo: tu correo electrónico, nombre, alarmas, misiones propias, resultados de misiones y ajustes. No guardamos ninguna copia.',
  },
  de: {
    kickerAccount: 'KONTO',
    kolomGegeven: 'Daten',
    kolomWaarvoor: 'Wofür',
    beschrijving: 'Mooove – der Wecker, der erst aufhört, wenn du in Bewegung bist.',
    privacy: 'Datenschutzerklärung',
    verwijderen: 'Konto löschen',
    taal: 'Sprache',
    intro:
      'Mooove ist der Wecker, der erst aufhört, wenn du wirklich in Bewegung gekommen bist. Wähle deine Missionen – Kniebeugen, Liegestütze, Bett machen oder Vorhänge öffnen – und starte jeden Tag stark.',
    camera:
      'Kamerabilder werden ausschließlich auf deinem eigenen Handy verarbeitet und nie gespeichert oder gesendet.',
    contact: 'Kontakt',
    verwijderTitel: 'Dein Mooove-Konto löschen',
    verwijderIntro: 'Du kannst dein Konto und alle zugehörigen Daten auf zwei Wegen löschen.',
    inApp: 'In der App (sofort)',
    stappen: [
      'Öffne Mooove und gehe zu <strong>Profil</strong>.',
      'Tippe auf <strong>Konto löschen</strong>.',
      'Bestätige. Dein Konto, deine Wecker und dein Fortschritt werden sofort und endgültig gelöscht.',
    ],
    zonderApp: 'Ohne die App',
    zonderAppTekst: `Du hast die App nicht mehr? Schicke eine E-Mail an <strong>${MAIL}</strong> mit dem Betreff &quot;Konto löschen&quot; von der E-Mail-Adresse, mit der du angemeldet bist. Wir löschen dein Konto und alle Daten innerhalb von 30 Tagen und bestätigen dies per E-Mail.`,
    watTitel: 'Was wird gelöscht?',
    watTekst:
      'Alles: deine E-Mail-Adresse, dein Vorname, deine Wecker, eigene Missionen, Missionsergebnisse und Einstellungen. Wir behalten keine Kopie.',
  },
  fr: {
    kickerAccount: 'COMPTE',
    kolomGegeven: 'Donnée',
    kolomWaarvoor: 'Pour quoi',
    beschrijving: 'Mooove — le réveil qui ne s’arrête que quand tu bouges.',
    privacy: 'Politique de confidentialité',
    verwijderen: 'Supprimer le compte',
    taal: 'Langue',
    intro:
      'Mooove est le réveil qui ne s’arrête que quand tu t’es vraiment mis en mouvement. Choisis tes missions — squats, pompes, faire ton lit ou ouvrir les rideaux — et commence chaque journée en force.',
    camera:
      'Les images de la caméra sont traitées uniquement sur ton propre téléphone et ne sont jamais enregistrées ni envoyées.',
    contact: 'Contact',
    verwijderTitel: 'Supprimer ton compte Mooove',
    verwijderIntro: 'Tu peux supprimer ton compte et toutes les données associées de deux façons.',
    inApp: 'Dans l’app (immédiatement)',
    stappen: [
      'Ouvre Mooove et va dans <strong>Profil</strong>.',
      'Touche <strong>Supprimer le compte</strong>.',
      'Confirme. Ton compte, tes alarmes et ta progression sont supprimés immédiatement et définitivement.',
    ],
    zonderApp: 'Sans l’app',
    zonderAppTekst: `Tu n’as plus l’app ? Envoie un e-mail à <strong>${MAIL}</strong> avec l’objet &quot;Supprimer le compte&quot; depuis l’adresse e-mail avec laquelle tu t’es connecté. Nous supprimons ton compte et toutes les données sous 30 jours et te le confirmons par e-mail.`,
    watTitel: 'Qu’est-ce qui est supprimé ?',
    watTekst:
      'Tout : ton adresse e-mail, ton prénom, tes alarmes, tes missions personnalisées, tes résultats de missions et tes réglages. Nous ne gardons aucune copie.',
  },
};

const NL_PAGINA = {
  index: '/',
  privacy: '/privacy',
  verwijderen: '/account-verwijderen',
  bevestigen: '/nieuwsbrief/bevestigen',
  afmelden: '/nieuwsbrief/afmelden',
};
const url = (taal, pagina) => (taal === 'nl' ? NL_PAGINA[pagina] : `/${taal}${NL_PAGINA[pagina]}`);
const NIEUWSBRIEF_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/nieuwsbrief`;

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const metMail = (s) => esc(s).replace(MAIL, `<a href="mailto:${MAIL}">${MAIL}</a>`);
const taalCode = (taal) => HREFLANG[taal] ?? taal;

// Stijl van de presentatiepagina plus de opmaak van de tekstpagina's
const stijl = `<style>${CSS}\n${fs.readFileSync(path.join(HIER, 'site-pagina.css'), 'utf8')}</style>`;

// Absolute links voor zoekmachines: canonical per pagina en hreflang voor alle talen
function hreflang(pagina, huidig) {
  return [
    huidig ? `<link rel="canonical" href="${DOMEIN}${url(huidig, pagina)}">` : '',
    ...TALEN.map(
      (taal) =>
        `<link rel="alternate" hreflang="${taalCode(taal)}" href="${DOMEIN}${url(taal, pagina)}">`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${DOMEIN}${url('nl', pagina)}">`,
  ].join('');
}

const LABELS = Object.fromEntries(
  Object.entries(TEKST).map(([t, x]) => [t, { privacy: x.privacy, verwijderen: x.verwijderen }]),
);

// Tekstpagina in dezelfde huisstijl als de presentatiepagina: menubalk, donkere kop, kaart, voettekst
function pagina(taal, soort, { titel, kicker, kop, datum }, inhoud) {
  const x = TEKST[taal];
  const opties = { talen: TALEN, taalnamen: TAALNAMEN, url, pagina: soort };
  return `<!doctype html><html lang="${taalCode(taal)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titel)}</title><meta name="description" content="${esc(x.beschrijving)}"><meta name="theme-color" content="#101714"><link rel="icon" href="${FAVICON}">${hreflang(soort, taal)}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
${stijl}</head><body>
${navigatie(taal, opties, url(taal, 'index'))}
<header class="pagina-kop"><div class="wrap"><p class="kicker">${esc(kicker)}</p><h1 class="kop">${esc(kop)}</h1>${datum ? `<p class="datum">${esc(datum)}</p>` : ''}</div></header>
<main class="tekst"><article>
${inhoud}
</article></main>
${voettekst(taal, { url, privacyLabel: LABELS[taal].privacy, verwijderLabel: LABELS[taal].verwijderen, mail: MAIL })}
</body></html>
`;
}

// "Gegeven: waarvoor" → twee kolommen (ook met de Chinese dubbele punt)
function gegevensTabel(taal, punten) {
  const rijen = punten.map((p) => {
    const m = p.match(/^(.+?)\s*[:：]\s*(.+)$/);
    const [gegeven, waarvoor] = m ? [m[1], m[2]] : [p, ''];
    return `<tr><td>${esc(gegeven)}</td><td>${metMail(waarvoor.charAt(0).toUpperCase() + waarvoor.slice(1))}</td></tr>`;
  });
  return `<div class="tabel"><table><thead><tr><th>${esc(TEKST[taal].kolomGegeven)}</th><th>${esc(TEKST[taal].kolomWaarvoor)}</th></tr></thead><tbody>${rijen.join('')}</tbody></table></div>`;
}

function privacyInhoud(taal) {
  const p = privacy[taal];
  const delen = [];
  if (p.voorrang.trim())
    delen.push(
      `<p class="voorrang">${esc(p.voorrang)} (<a href="/privacy" hreflang="nl" lang="nl">Nederlands</a>)</p>`,
    );
  for (const [sleutel, sectie] of Object.entries(p)) {
    if (typeof sectie !== 'object') continue;
    if (sleutel !== 'over') delen.push(`<h2>${esc(sectie.kop)}</h2>`);
    const alineas = Object.keys(sectie).filter((k) => /^a\d+$/.test(k));
    const punten = Object.keys(sectie).filter((k) => /^p\d+$/.test(k));
    for (const k of alineas) delen.push(`<p>${metMail(sectie[k])}</p>`);
    if (!punten.length) continue;
    delen.push(
      sleutel === 'gegevens'
        ? gegevensTabel(
            taal,
            punten.map((k) => sectie[k]),
          )
        : `<ul>${punten.map((k) => `<li>${metMail(sectie[k])}</li>`).join('')}</ul>`,
    );
  }
  return delen.join('\n');
}

for (const taal of TALEN) {
  const x = TEKST[taal];
  const map = taal === 'nl' ? SITE : path.join(SITE, taal);
  fs.mkdirSync(map, { recursive: true });
  const datum = privacy[taal].bijgewerkt.replace(
    '{{datum}}',
    BIJGEWERKT.toLocaleDateString(LOCALES[taal], {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );
  fs.writeFileSync(
    path.join(map, 'privacy.html'),
    pagina(
      taal,
      'privacy',
      {
        titel: `${x.privacy} · Mooove`,
        kicker: privacy[taal].kicker,
        kop: `${x.privacy} Mooove`,
        datum,
      },
      privacyInhoud(taal),
    ),
  );
  fs.writeFileSync(
    path.join(map, 'account-verwijderen.html'),
    pagina(
      taal,
      'verwijderen',
      { titel: `${x.verwijderen} · Mooove`, kicker: x.kickerAccount, kop: x.verwijderTitel },
      `<p>${x.verwijderIntro}</p>
<h2>${x.inApp}</h2>
<ol class="stappenlijst">${x.stappen.map((s) => `<li><span>${s}</span></li>`).join('')}</ol>
<h2>${x.zonderApp}</h2>
<p>${x.zonderAppTekst}</p>
<h2>${x.watTitel}</h2>
<p>${x.watTekst}</p>`,
    ),
  );
}

// Nieuwsbrief: bevestigen (dubbele opt-in) en afmelden zonder login. De token staat in het
// #-deel van de link, zodat hij niet in serverlogs komt; de pagina stuurt hem naar de functie.
for (const taal of TALEN) {
  const n = LANDING[taal].nieuwsbrief;
  const map = path.join(taal === 'nl' ? SITE : path.join(SITE, taal), 'nieuwsbrief');
  fs.mkdirSync(map, { recursive: true });
  const home = `<p><a href="${url(taal, 'index')}">${esc(n.naarHome)} →</a></p>`;
  fs.writeFileSync(
    path.join(map, 'bevestigen.html'),
    pagina(
      taal,
      'bevestigen',
      { titel: `${n.bevestigTitel} · Mooove`, kicker: 'THE MORNING MOOOVE', kop: n.bevestigTitel },
      `<p id="status" role="status" aria-live="polite">${esc(n.bevestigBezig)}</p>${home}
<script>
(async () => {
  const status = document.getElementById('status');
  const t = new URLSearchParams(location.hash.slice(1)).get('t');
  history.replaceState(null, '', location.pathname);
  const tekst = ${JSON.stringify({ gelukt: n.bevestigGelukt, verlopen: n.bevestigVerlopen, ongeldig: n.bevestigOngeldig })};
  if (!t) { status.textContent = tekst.ongeldig; return; }
  try {
    const r = await fetch('${NIEUWSBRIEF_URL}', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actie: 'bevestigen', token: t }) });
    status.textContent = r.ok ? tekst.gelukt : r.status === 410 ? tekst.verlopen : tekst.ongeldig;
  } catch { status.textContent = tekst.ongeldig; }
})();
</script>`,
    ),
  );
  fs.writeFileSync(
    path.join(map, 'afmelden.html'),
    pagina(
      taal,
      'afmelden',
      { titel: `${n.afmeldTitel} · Mooove`, kicker: 'THE MORNING MOOOVE', kop: n.afmeldTitel },
      `<p>${esc(n.afmeldTekst)}</p>
<p><button id="afmelden" class="knop" type="button">${esc(n.afmeldKnop)}</button></p>
<p id="status" role="status" aria-live="polite"></p>${home}
<script>
(() => {
  const t = new URLSearchParams(location.hash.slice(1)).get('t');
  history.replaceState(null, '', location.pathname);
  const knop = document.getElementById('afmelden');
  const status = document.getElementById('status');
  const tekst = ${JSON.stringify({ gelukt: n.afmeldGelukt, fout: n.afmeldFout })};
  knop.addEventListener('click', async () => {
    knop.disabled = true;
    try {
      const r = await fetch('${NIEUWSBRIEF_URL}', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actie: 'afmelden', token: t }) });
      status.textContent = r.ok ? tekst.gelukt : tekst.fout;
      if (r.ok) knop.remove(); else knop.disabled = false;
    } catch { status.textContent = tekst.fout; knop.disabled = false; }
  });
})();
</script>`,
    ),
  );
}

// Presentatiepagina in alle talen (Nederlands op /)
for (const taal of TALEN) {
  const map = taal === 'nl' ? SITE : path.join(SITE, taal);
  fs.writeFileSync(
    path.join(map, 'index.html'),
    landing(taal, {
      talen: TALEN,
      taalnamen: TAALNAMEN,
      url,
      hreflang: (soort) => hreflang(soort, taal),
      domein: DOMEIN,
      wachtlijstUrl: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/wachtlijst`,
      nieuwsbriefUrl: NIEUWSBRIEF_URL,
      privacyLabel: LABELS[taal].privacy,
      verwijderLabel: LABELS[taal].verwijderen,
      mail: MAIL,
    }),
  );
}

// Zoekmachines: sitemap met alle openbare pagina's, beheer uitgesloten
const PAGINAS = ['index', 'privacy', 'verwijderen'];
fs.writeFileSync(
  path.join(SITE, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${PAGINAS.flatMap((soort) =>
  TALEN.map(
    (taal) =>
      `  <url><loc>${DOMEIN}${url(taal, soort)}</loc>${TALEN.map((t) => `<xhtml:link rel="alternate" hreflang="${taalCode(t)}" href="${DOMEIN}${url(t, soort)}"/>`).join('')}</url>`,
  ),
).join('\n')}
</urlset>
`,
);
fs.writeFileSync(
  path.join(SITE, 'robots.txt'),
  `User-agent: *\nDisallow: /admin\n\nSitemap: ${DOMEIN}/sitemap.xml\n`,
);

// Beheeromgeving: alleen publieke sleutels (zelfde als de app), de toegang regelt de Edge Function
const sbUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const sbKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!sbUrl || !sbKey)
  throw new Error('EXPO_PUBLIC_SUPABASE_URL en EXPO_PUBLIC_SUPABASE_ANON_KEY ontbreken (.env).');
fs.writeFileSync(
  path.join(SITE, 'admin.html'),
  fs
    .readFileSync(path.join(HIER, 'site-admin.html'), 'utf8')
    .replace('__SUPABASE_URL__', sbUrl)
    .replace('__SUPABASE_KEY__', sbKey),
);
console.log("Site gebouwd: presentatie in zes talen, tekstpagina's en beheer");
