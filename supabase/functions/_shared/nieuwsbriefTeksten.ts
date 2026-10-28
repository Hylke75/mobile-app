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
  // Welkomstmail na bevestiging
  welkomOnderwerp: string;
  welkomTitel: string;
  welkomTekst: string;
  welkomKnop: string;
  // Verplichte voettekst onder elke nieuwsbrief
  waarom: string;
  afmelden: string;
  test: string;
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
    welkomOnderwerp: 'Welkom bij betere ochtenden ☀️',
    welkomTitel: 'Welkom bij The Morning MOOOVE',
    welkomTekst:
      "Mooove helpt je uit bed door 's ochtends een korte wekmissie te doen. Ongeveer om de twee weken krijg je een praktische ochtendtip en nieuws uit de app.",
    welkomKnop: 'Bekijk Mooove',
    waarom:
      'Je ontvangt deze e-mail omdat je je hebt aangemeld voor The Morning MOOOVE, de nieuwsbrief van Mooove (Hylke Thiry, hylke@linkandlead.nl).',
    afmelden: 'Afmelden',
    test: 'TEST — deze mail is alleen naar testadressen verstuurd',
  },
  en: {
    toestemming:
      'Yes, send me the Mooove newsletter: about twice a month, tips for better mornings and news about the app. You can unsubscribe anytime with one click.',
    onderwerp: 'Confirm your Mooove newsletter subscription',
    titel: 'One more click',
    alinea1:
      'Thanks for subscribing. About twice a month you’ll get tips for better mornings and news about Mooove.',
    alinea2:
      'Please confirm your subscription with the button below. The link is valid for 48 hours.',
    knop: 'Confirm subscription',
    voet: 'Didn’t sign up? Just ignore this email and you won’t hear from us again. Questions: hylke@linkandlead.nl.',
    welkomOnderwerp: 'Welcome to better mornings ☀️',
    welkomTitel: 'Welcome to The Morning MOOOVE',
    welkomTekst:
      'Mooove helps you get out of bed by completing a short wake-up mission. About every other week you’ll get a practical morning tip and news from the app.',
    welkomKnop: 'Discover Mooove',
    waarom:
      'You’re receiving this email because you subscribed to The Morning MOOOVE, the Mooove newsletter (Hylke Thiry, hylke@linkandlead.nl).',
    afmelden: 'Unsubscribe',
    test: 'TEST — this email was only sent to test addresses',
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
    welkomOnderwerp: 'Bienvenido a mañanas mejores ☀️',
    welkomTitel: 'Bienvenido a The Morning MOOOVE',
    welkomTekst:
      'Mooove te ayuda a levantarte con una breve misión al despertar. Más o menos cada dos semanas recibirás un consejo práctico para tus mañanas y novedades de la app.',
    welkomKnop: 'Descubre Mooove',
    waarom:
      'Recibes este correo porque te suscribiste a The Morning MOOOVE, el boletín de Mooove (Hylke Thiry, hylke@linkandlead.nl).',
    afmelden: 'Darse de baja',
    test: 'PRUEBA — este correo solo se ha enviado a direcciones de prueba',
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
    welkomOnderwerp: 'Willkommen zu besseren Morgen ☀️',
    welkomTitel: 'Willkommen bei The Morning MOOOVE',
    welkomTekst:
      'Mooove hilft dir aus dem Bett, indem du morgens eine kurze Weckmission erledigst. Etwa alle zwei Wochen bekommst du einen praktischen Morgentipp und Neuigkeiten aus der App.',
    welkomKnop: 'Mooove entdecken',
    waarom:
      'Du erhältst diese E-Mail, weil du The Morning MOOOVE abonniert hast, den Newsletter von Mooove (Hylke Thiry, hylke@linkandlead.nl).',
    afmelden: 'Abmelden',
    test: 'TEST — diese E-Mail ging nur an Testadressen',
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
    welkomOnderwerp: 'Bienvenue vers de meilleurs matins ☀️',
    welkomTitel: 'Bienvenue dans The Morning MOOOVE',
    welkomTekst:
      'Mooove t’aide à sortir du lit grâce à une courte mission au réveil. Environ toutes les deux semaines, tu recevras une astuce pratique pour tes matins et des nouvelles de l’app.',
    welkomKnop: 'Découvrir Mooove',
    waarom:
      'Tu reçois cet e-mail parce que tu t’es abonné à The Morning MOOOVE, la newsletter de Mooove (Hylke Thiry, hylke@linkandlead.nl).',
    afmelden: 'Se désinscrire',
    test: 'TEST — cet e-mail n’a été envoyé qu’à des adresses de test',
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
    welkomOnderwerp: '欢迎开启更美好的早晨 ☀️',
    welkomTitel: '欢迎订阅 The Morning MOOOVE',
    welkomTekst:
      'Mooove 通过一个简短的起床任务帮助你起床。大约每两周你会收到一条实用的早晨建议和应用新闻。',
    welkomKnop: '了解 Mooove',
    waarom:
      '你收到这封邮件是因为你订阅了 Mooove 的新闻通讯 The Morning MOOOVE（Hylke Thiry，hylke@linkandlead.nl）。',
    afmelden: '退订',
    test: '测试——此邮件仅发送至测试地址',
  },
};
