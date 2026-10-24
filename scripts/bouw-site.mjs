// Bouwt de vertaalde pagina's van de site (site/en, site/es, site/de, site/fr) uit de appteksten.
// De Nederlandse pagina's in site/ zijn leidend en worden met de hand bijgehouden.
// Gebruik: npm run site
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { privacy } from '../src/i18n/teksten/privacy.ts';

const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const BIJGEWERKT = new Date(2026, 9, 24);
const MAIL = 'hylke@linkandlead.nl';
const TALEN = ['nl', 'en', 'es', 'de', 'fr'];
const TAALNAMEN = { nl: 'Nederlands', en: 'English', es: 'Español', de: 'Deutsch', fr: 'Français' };
const LOCALES = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR' };

const TEKST = {
  en: {
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

const NL_PAGINA = { index: '/', privacy: '/privacy', verwijderen: '/account-verwijderen' };
const url = (taal, pagina) =>
  taal === 'nl'
    ? NL_PAGINA[pagina]
    : `/${taal}${{ index: '/', privacy: '/privacy', verwijderen: '/account-verwijderen' }[pagina]}`;

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const metMail = (s) => esc(s).replace(MAIL, `<a href="mailto:${MAIL}">${MAIL}</a>`);

// Stijl en logo komen uit de Nederlandse startpagina, zodat alle pagina's gelijk blijven
const bron = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const stijl = bron.match(/<style>[\s\S]*?<\/style>/)[0];

function talenlijst(huidig, pagina) {
  return TALEN.map((taal) =>
    taal === huidig
      ? `<strong>${TAALNAMEN[taal]}</strong>`
      : `<a href="${url(taal, pagina)}" hreflang="${taal}" lang="${taal}">${TAALNAMEN[taal]}</a>`,
  ).join(' · ');
}

function hreflang(pagina) {
  return TALEN.map(
    (taal) => `<link rel="alternate" hreflang="${taal}" href="${url(taal, pagina)}">`,
  ).join('');
}

function pagina(taal, soort, titel, inhoud) {
  const x = TEKST[taal];
  return `<!doctype html><html lang="${taal}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titel}</title><meta name="description" content="${esc(x.beschrijving)}">${hreflang(soort)}${stijl}</head><body>
<header><a href="${url(taal, 'index')}"><span class="glyph"><b>m<i>.</i></b></span><span class="word">mooove<span>.</span></span></a></header>
<main>${inhoud}</main><footer>© 2026 Hylke Thiry · <a href="${url(taal, 'privacy')}">${x.privacy}</a> · <a href="${url(taal, 'verwijderen')}">${x.verwijderen}</a><br>${x.taal}: ${talenlijst(taal, soort)}</footer></body></html>
`;
}

function privacyInhoud(taal) {
  const p = privacy[taal];
  const datum = BIJGEWERKT.toLocaleDateString(LOCALES[taal], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const delen = [
    `<h1>${esc(TEKST[taal].privacy)} Mooove</h1>`,
    `<p><em>${esc(p.bijgewerkt.replace('{{datum}}', datum))}</em></p>`,
    `<p><em>${esc(p.voorrang)} (<a href="/privacy" hreflang="nl" lang="nl">Nederlands</a>)</em></p>`,
  ];
  for (const [sleutel, sectie] of Object.entries(p)) {
    if (typeof sectie !== 'object') continue;
    if (sleutel !== 'over') delen.push(`<h2>${esc(sectie.kop)}</h2>`);
    const alineas = Object.keys(sectie).filter((k) => /^a\d+$/.test(k));
    const punten = Object.keys(sectie).filter((k) => /^p\d+$/.test(k));
    for (const k of alineas) delen.push(`<p>${metMail(sectie[k])}</p>`);
    if (punten.length)
      delen.push(`<ul>${punten.map((k) => `<li>${metMail(sectie[k])}</li>`).join('')}</ul>`);
  }
  return delen.join('\n');
}

for (const taal of TALEN.filter((t) => t !== 'nl')) {
  const x = TEKST[taal];
  const map = path.join(SITE, taal);
  fs.mkdirSync(map, { recursive: true });
  fs.writeFileSync(
    path.join(map, 'index.html'),
    pagina(
      taal,
      'index',
      'Mooove',
      `<h1>Stop snoozing.<br>Start moving.</h1>
<p>${x.intro}</p>
<p>${x.camera}</p>
<p><a class="cta" href="${url(taal, 'privacy')}">${x.privacy}</a><a class="cta" href="${url(taal, 'verwijderen')}">${x.verwijderen}</a></p>
<h2>${x.contact}</h2><p>Hylke Thiry — <a href="mailto:${MAIL}">${MAIL}</a></p>`,
    ),
  );
  fs.writeFileSync(
    path.join(map, 'privacy.html'),
    pagina(taal, 'privacy', `${x.privacy} · Mooove`, privacyInhoud(taal)),
  );
  fs.writeFileSync(
    path.join(map, 'account-verwijderen.html'),
    pagina(
      taal,
      'verwijderen',
      `${x.verwijderen} · Mooove`,
      `<h1>${x.verwijderTitel}</h1>
<p>${x.verwijderIntro}</p>
<h2>${x.inApp}</h2>
<ol>${x.stappen.map((s) => `<li>${s}</li>`).join('')}</ol>
<h2>${x.zonderApp}</h2>
<p>${x.zonderAppTekst}</p>
<h2>${x.watTitel}</h2>
<p>${x.watTekst}</p>`,
    ),
  );
}
console.log('Site gebouwd: en, es, de, fr');
