// Teksten voor de nieuwsbriefaanmelding (bevestigingsmail en toestemmingstekst), per taal.
// De toestemmingstekst wordt als bewijs bij de aanmelding opgeslagen; houd hem gelijk aan het
// formulier op de site (scripts/site-teksten.mjs, sleutel nieuwsbrief.toestemming).
import type { Taal } from './marketing.ts';

export const TOESTEMMING_VERSIE = '2026-10-28';

type Teksten = {
  toestemming: string;
  onderwerp: string;
  titel: string;
  alinea1: string;
  alinea2: string;
  knop: string;
  voet: string;
};

export const NIEUWSBRIEF_TEKSTEN: Record<Taal, Teksten> = {
  nl: {
    toestemming:
      'Ja, stuur mij de Mooove-nieuwsbrief: ongeveer twee keer per maand tips voor betere ochtenden en nieuws over de app. Afmelden kan altijd met één klik.',
    onderwerp: 'Bevestig je aanmelding voor de Mooove-nieuwsbrief',
    titel: 'Nog één klik',
    alinea1:
      'Bedankt voor je aanmelding. Je krijgt ongeveer twee keer per maand tips voor betere ochtenden en nieuws over Mooove.',
    alinea2: 'Bevestig je aanmelding met de knop hieronder. De link is 48 uur geldig.',
    knop: 'Bevestig aanmelding',
    voet: 'Heb je je niet aangemeld? Dan kun je deze e-mail negeren; je ontvangt niets meer van ons. Vragen: hylke@linkandlead.nl.',
  },
  en: {
    toestemming:
      'Yes, send me the Mooove newsletter: about twice a month, tips for better mornings and news about the app. You can unsubscribe anytime with one click.',
    onderwerp: 'Confirm your Mooove newsletter subscription',
    titel: 'One more click',
    alinea1:
      'Thanks for subscribing. About twice a month you’ll get tips for better mornings and news about Mooove.',
    alinea2: 'Please confirm your subscription with the button below. The link is valid for 48 hours.',
    knop: 'Confirm subscription',
    voet: 'Didn’t sign up? Just ignore this email and you won’t hear from us again. Questions: hylke@linkandlead.nl.',
  },
  es: {
    toestemming:
      'Sí, envíame el boletín de Mooove: unas dos veces al mes, consejos para mañanas mejores y novedades de la app. Puedes darte de baja cuando quieras con un clic.',
    onderwerp: 'Confirma tu suscripción al boletín de Mooove',
    titel: 'Un clic más',
    alinea1:
      'Gracias por suscribirte. Unas dos veces al mes recibirás consejos para mañanas mejores y novedades de Mooove.',
    alinea2: 'Confirma tu suscripción con el botón de abajo. El enlace es válido durante 48 horas.',
    knop: 'Confirmar suscripción',
    voet: '¿No te has suscrito? Ignora este correo y no volverás a saber de nosotros. Preguntas: hylke@linkandlead.nl.',
  },
  de: {
    toestemming:
      'Ja, schickt mir den Mooove-Newsletter: etwa zweimal im Monat Tipps für bessere Morgen und Neuigkeiten zur App. Abmelden ist jederzeit mit einem Klick möglich.',
    onderwerp: 'Bestätige deine Anmeldung zum Mooove-Newsletter',
    titel: 'Noch ein Klick',
    alinea1:
      'Danke für deine Anmeldung. Etwa zweimal im Monat bekommst du Tipps für bessere Morgen und Neuigkeiten zu Mooove.',
    alinea2: 'Bestätige deine Anmeldung mit dem Button unten. Der Link ist 48 Stunden gültig.',
    knop: 'Anmeldung bestätigen',
    voet: 'Du hast dich nicht angemeldet? Dann ignoriere diese E-Mail; du hörst nichts mehr von uns. Fragen: hylke@linkandlead.nl.',
  },
  fr: {
    toestemming:
      'Oui, envoyez-moi la newsletter Mooove : environ deux fois par mois, des conseils pour de meilleurs matins et des nouvelles de l’app. Désinscription possible à tout moment en un clic.',
    onderwerp: 'Confirme ton inscription à la newsletter Mooove',
    titel: 'Encore un clic',
    alinea1:
      'Merci pour ton inscription. Environ deux fois par mois, tu recevras des conseils pour de meilleurs matins et des nouvelles de Mooove.',
    alinea2: 'Confirme ton inscription avec le bouton ci-dessous. Le lien est valable 48 heures.',
    knop: 'Confirmer l’inscription',
    voet: 'Tu ne t’es pas inscrit ? Ignore simplement cet e-mail, tu ne recevras plus rien de notre part. Questions : hylke@linkandlead.nl.',
  },
  zh: {
    toestemming:
      '是的，请给我发送 Mooove 新闻通讯：大约每月两次，提供更美好早晨的建议和应用新闻。随时可一键退订。',
    onderwerp: '确认订阅 Mooove 新闻通讯',
    titel: '还差一步',
    alinea1: '感谢订阅。你大约每月会收到两次关于更美好早晨的建议和 Mooove 的新闻。',
    alinea2: '请点击下方按钮确认订阅。链接 48 小时内有效。',
    knop: '确认订阅',
    voet: '如果你没有订阅，请忽略此邮件，我们不会再联系你。如有疑问：hylke@linkandlead.nl。',
  },
};
