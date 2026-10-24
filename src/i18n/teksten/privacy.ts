import type { Vertalingen } from '@/i18n/talen';

// Secties van de privacyverklaring; de volgorde staat in src/constants/privacyverklaring.ts
const nl = {
  kicker: 'JOUW GEGEVENS',
  titel: 'Privacy',
  bijgewerkt: 'Laatst bijgewerkt: {{datum}}',
  // Alleen in de vertalingen: de Nederlandse tekst is leidend
  voorrang: '',
  over: {
    kop: 'Over deze verklaring',
    a1: 'Mooove is een wekker-app die je helpt om \'s ochtends in beweging te komen. Mooove wordt aangeboden door Hylke Thiry ("wij"). Hier lees je welke gegevens we verwerken, waarom, en welke rechten je hebt.',
  },
  gegevens: {
    kop: 'Welke gegevens verwerken we?',
    a1: 'We bewaren deze gegevens zolang je account bestaat:',
    p1: 'E-mailadres: om in te loggen met een eenmalige code en je account te beheren.',
    p2: 'Voornaam: om je in de app te begroeten.',
    p3: 'Alarmen (tijd, dagen, niveau, gekozen oefeningen en aantallen, naam): om je alarmen in te plannen en op al je toestellen beschikbaar te maken.',
    p4: 'Missieresultaten (start- en eindtijd, oefeningen, aantal herhalingen, voltooid of afgebroken): om je streak, voortgang en badges te tonen.',
    p5: 'Weekdoel en datum van je laatste geslaagde alarmtest: om je instellingen en alarm-check te tonen.',
    p6: 'Eigen missies (naam, icoon, timer of foto en duur): om ze in je alarmen te gebruiken.',
  },
  camera: {
    kop: 'Camera',
    a1: 'Mooove gebruikt de camera tijdens een missie om oefeningen te herkennen (bijvoorbeeld het tellen van squats), om te meten of het lichter wordt als je de gordijnen opent, en voor een foto als bevestiging dat je bed is opgemaakt.',
    a2: 'Deze beelden worden uitsluitend op je eigen toestel verwerkt. Ze worden nooit opgeslagen, nooit naar onze servers gestuurd en nooit met anderen gedeeld. De bevestigingsfoto wordt direct na het maken weer verwijderd. Mooove neemt geen geluid op.',
  },
  lokaal: {
    kop: 'Alleen op je toestel',
    a1: 'Een eigen alarmgeluid dat je kiest, blijft op je toestel en wordt niet naar ons verstuurd. Hetzelfde geldt voor de lokale kopie van je alarmen en voortgang, die Mooove bewaart zodat de app ook zonder internet werkt.',
  },
  foutrapporten: {
    kop: 'Foutrapporten',
    a1: "Crasht de app, dan kan Mooove een technisch foutrapport sturen naar Sentry (servers in de EU). Zo'n rapport bevat het type toestel, de versie van de app en waar het misging, maar geen naam, e-mailadres, IP-adres of camerabeelden, en is niet aan je account gekoppeld. Rapporten worden na maximaal 90 dagen verwijderd.",
  },
  nietDoen: {
    kop: 'Wat we niet doen',
    p1: 'We tonen geen advertenties en gebruiken geen advertentie- of trackingdiensten.',
    p2: 'We verkopen of delen je gegevens niet met derden voor marketing.',
    p3: 'We verwerken geen gezondheids- of medische gegevens.',
  },
  verwerkers: {
    kop: 'Verwerkers',
    a1: 'Je gegevens worden opgeslagen bij Supabase (database en inloggen), in een datacenter in de Europese Unie (Frankfurt, Duitsland). Foutrapporten gaan naar Sentry, eveneens in de EU. Beide verwerken de gegevens uitsluitend in onze opdracht.',
  },
  grondslag: {
    kop: 'Grondslag',
    a1: 'We verwerken je gegevens omdat dit nodig is om de app aan je te leveren (uitvoering van de overeenkomst, artikel 6 lid 1 sub b AVG).',
  },
  rechten: {
    kop: 'Je rechten',
    a1: 'Je hebt het recht om je gegevens in te zien, te corrigeren en te laten verwijderen. Via Profiel → Mijn gegevens downloaden krijg je direct een kopie van al je gegevens. Je kunt je account en al je gegevens op elk moment zelf verwijderen via Profiel → Account verwijderen. Alle gegevens worden dan direct en definitief gewist.',
    a2: 'Heb je een klacht over hoe we met je gegevens omgaan? Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.',
  },
  beveiliging: {
    kop: 'Beveiliging',
    a1: 'Gegevens worden versleuteld verzonden (HTTPS). Je sessie wordt versleuteld op je toestel bewaard. In de database kan elke gebruiker alleen bij zijn eigen gegevens.',
  },
  contact: {
    kop: 'Contact',
    a1: 'Hylke Thiry — hylke@linkandlead.nl',
  },
};

export const privacy: Vertalingen<typeof nl> = {
  nl,
  en: {
    kicker: 'YOUR DATA',
    titel: 'Privacy',
    bijgewerkt: 'Last updated: {{datum}}',
    voorrang:
      'This is a translation of the Dutch privacy policy. In case of any differences, the Dutch version prevails.',
    over: {
      kop: 'About this policy',
      a1: 'Mooove is an alarm clock app that helps you get moving in the morning. Mooove is offered by Hylke Thiry ("we"). Here you can read which data we process, why, and what rights you have.',
    },
    gegevens: {
      kop: 'What data do we process?',
      a1: 'We keep this data for as long as your account exists:',
      p1: 'Email address: to log in with a one-time code and manage your account.',
      p2: 'First name: to greet you in the app.',
      p3: 'Alarms (time, days, level, chosen exercises and amounts, name): to schedule your alarms and make them available on all your devices.',
      p4: 'Mission results (start and end time, exercises, number of reps, completed or stopped): to show your streak, progress and badges.',
      p5: 'Weekly goal and the date of your last successful alarm test: to show your settings and alarm check.',
      p6: 'Your own missions (name, icon, timer or photo and duration): to use them in your alarms.',
    },
    camera: {
      kop: 'Camera',
      a1: 'Mooove uses the camera during a mission to recognize exercises (for example, counting squats), to measure whether it gets brighter when you open the curtains, and to take a photo confirming that your bed is made.',
      a2: 'These images are processed only on your own device. They are never stored, never sent to our servers and never shared with anyone. The confirmation photo is deleted right after it’s taken. Mooove does not record any sound.',
    },
    lokaal: {
      kop: 'Only on your device',
      a1: 'A custom alarm sound you choose stays on your device and is not sent to us. The same goes for the local copy of your alarms and progress, which Mooove keeps so the app also works without internet.',
    },
    foutrapporten: {
      kop: 'Error reports',
      a1: 'If the app crashes, Mooove may send a technical error report to Sentry (servers in the EU). Such a report contains the device type, the app version and where things went wrong, but no name, email address, IP address or camera images, and it is not linked to your account. Reports are deleted after 90 days at most.',
    },
    nietDoen: {
      kop: 'What we don’t do',
      p1: 'We don’t show ads and don’t use any advertising or tracking services.',
      p2: 'We don’t sell or share your data with third parties for marketing.',
      p3: 'We don’t process any health or medical data.',
    },
    verwerkers: {
      kop: 'Processors',
      a1: 'Your data is stored with Supabase (database and login), in a data center in the European Union (Frankfurt, Germany). Error reports go to Sentry, also in the EU. Both process the data solely on our behalf.',
    },
    grondslag: {
      kop: 'Legal basis',
      a1: 'We process your data because this is necessary to provide the app to you (performance of a contract, Article 6(1)(b) GDPR).',
    },
    rechten: {
      kop: 'Your rights',
      a1: 'You have the right to access, correct and delete your data. Via Profile → Download my data you immediately get a copy of all your data. You can delete your account and all your data yourself at any time via Profile → Delete account. All data is then erased immediately and permanently.',
      a2: 'Do you have a complaint about how we handle your data? You can also file a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).',
    },
    beveiliging: {
      kop: 'Security',
      a1: 'Data is sent encrypted (HTTPS). Your session is stored encrypted on your device. In the database, every user can only access their own data.',
    },
    contact: {
      kop: 'Contact',
      a1: 'Hylke Thiry — hylke@linkandlead.nl',
    },
  },
  es: {
    kicker: 'TUS DATOS',
    titel: 'Privacidad',
    bijgewerkt: 'Última actualización: {{datum}}',
    voorrang:
      'Esta es una traducción de la política de privacidad en neerlandés. En caso de diferencias, prevalece la versión neerlandesa.',
    over: {
      kop: 'Sobre esta política',
      a1: 'Mooove es una app de alarma que te ayuda a ponerte en movimiento por la mañana. Mooove la ofrece Hylke Thiry ("nosotros"). Aquí puedes leer qué datos tratamos, por qué y qué derechos tienes.',
    },
    gegevens: {
      kop: '¿Qué datos tratamos?',
      a1: 'Conservamos estos datos mientras exista tu cuenta:',
      p1: 'Correo electrónico: para iniciar sesión con un código de un solo uso y gestionar tu cuenta.',
      p2: 'Nombre: para saludarte en la app.',
      p3: 'Alarmas (hora, días, nivel, ejercicios y cantidades elegidos, nombre): para programar tus alarmas y tenerlas disponibles en todos tus dispositivos.',
      p4: 'Resultados de las misiones (hora de inicio y fin, ejercicios, número de repeticiones, completada o interrumpida): para mostrar tu racha, tu progreso y tus insignias.',
      p5: 'Objetivo semanal y fecha de tu última prueba de alarma superada: para mostrar tus ajustes y la comprobación de alarma.',
      p6: 'Tus misiones propias (nombre, icono, temporizador o foto y duración): para usarlas en tus alarmas.',
    },
    camera: {
      kop: 'Cámara',
      a1: 'Mooove usa la cámara durante una misión para reconocer ejercicios (por ejemplo, contar sentadillas), para medir si hay más luz cuando abres las cortinas y para hacer una foto que confirme que has hecho la cama.',
      a2: 'Estas imágenes se procesan únicamente en tu propio dispositivo. Nunca se guardan, nunca se envían a nuestros servidores y nunca se comparten con nadie. La foto de confirmación se elimina justo después de hacerla. Mooove no graba sonido.',
    },
    lokaal: {
      kop: 'Solo en tu dispositivo',
      a1: 'El sonido de alarma propio que elijas se queda en tu dispositivo y no se nos envía. Lo mismo ocurre con la copia local de tus alarmas y tu progreso, que Mooove guarda para que la app funcione también sin internet.',
    },
    foutrapporten: {
      kop: 'Informes de errores',
      a1: 'Si la app falla, Mooove puede enviar un informe técnico de error a Sentry (servidores en la UE). Ese informe contiene el tipo de dispositivo, la versión de la app y dónde falló, pero no tu nombre, correo electrónico, dirección IP ni imágenes de la cámara, y no está vinculado a tu cuenta. Los informes se eliminan como máximo a los 90 días.',
    },
    nietDoen: {
      kop: 'Lo que no hacemos',
      p1: 'No mostramos anuncios ni usamos servicios de publicidad o seguimiento.',
      p2: 'No vendemos ni compartimos tus datos con terceros con fines de marketing.',
      p3: 'No tratamos datos de salud ni datos médicos.',
    },
    verwerkers: {
      kop: 'Encargados del tratamiento',
      a1: 'Tus datos se guardan en Supabase (base de datos e inicio de sesión), en un centro de datos de la Unión Europea (Fráncfort, Alemania). Los informes de errores van a Sentry, también en la UE. Ambos tratan los datos exclusivamente por encargo nuestro.',
    },
    grondslag: {
      kop: 'Base jurídica',
      a1: 'Tratamos tus datos porque es necesario para ofrecerte la app (ejecución de un contrato, artículo 6, apartado 1, letra b) del RGPD).',
    },
    rechten: {
      kop: 'Tus derechos',
      a1: 'Tienes derecho a acceder a tus datos, corregirlos y solicitar su eliminación. En Perfil → Descargar mis datos obtienes al instante una copia de todos tus datos. Puedes eliminar tu cuenta y todos tus datos tú mismo en cualquier momento en Perfil → Eliminar cuenta. Todos los datos se borran entonces de inmediato y de forma definitiva.',
      a2: '¿Tienes una queja sobre cómo tratamos tus datos? También puedes presentar una reclamación ante la autoridad neerlandesa de protección de datos (Autoriteit Persoonsgegevens).',
    },
    beveiliging: {
      kop: 'Seguridad',
      a1: 'Los datos se envían cifrados (HTTPS). Tu sesión se guarda cifrada en tu dispositivo. En la base de datos, cada usuario solo puede acceder a sus propios datos.',
    },
    contact: {
      kop: 'Contacto',
      a1: 'Hylke Thiry — hylke@linkandlead.nl',
    },
  },
  de: {
    kicker: 'DEINE DATEN',
    titel: 'Datenschutz',
    bijgewerkt: 'Zuletzt aktualisiert: {{datum}}',
    voorrang:
      'Dies ist eine Übersetzung der niederländischen Datenschutzerklärung. Bei Abweichungen gilt die niederländische Fassung.',
    over: {
      kop: 'Über diese Erklärung',
      a1: 'Mooove ist eine Wecker-App, die dir hilft, morgens in Bewegung zu kommen. Mooove wird von Hylke Thiry („wir“) angeboten. Hier erfährst du, welche Daten wir verarbeiten, warum und welche Rechte du hast.',
    },
    gegevens: {
      kop: 'Welche Daten verarbeiten wir?',
      a1: 'Wir speichern diese Daten, solange dein Konto besteht:',
      p1: 'E-Mail-Adresse: um dich mit einem einmaligen Code anzumelden und dein Konto zu verwalten.',
      p2: 'Vorname: um dich in der App zu begrüßen.',
      p3: 'Alarme (Uhrzeit, Tage, Stufe, gewählte Übungen und Anzahl, Name): um deine Alarme zu planen und auf all deinen Geräten verfügbar zu machen.',
      p4: 'Missionsergebnisse (Start- und Endzeit, Übungen, Anzahl der Wiederholungen, abgeschlossen oder abgebrochen): um deine Streak, deinen Fortschritt und deine Abzeichen anzuzeigen.',
      p5: 'Wochenziel und Datum deines letzten erfolgreichen Alarmtests: um deine Einstellungen und den Alarm-Check anzuzeigen.',
      p6: 'Eigene Missionen (Name, Symbol, Timer oder Foto und Dauer): um sie in deinen Weckern zu verwenden.',
    },
    camera: {
      kop: 'Kamera',
      a1: 'Mooove nutzt die Kamera während einer Mission, um Übungen zu erkennen (zum Beispiel Squats zu zählen), um zu messen, ob es heller wird, wenn du die Vorhänge öffnest, und für ein Foto als Bestätigung, dass dein Bett gemacht ist.',
      a2: 'Diese Bilder werden ausschließlich auf deinem eigenen Gerät verarbeitet. Sie werden nie gespeichert, nie an unsere Server gesendet und nie mit anderen geteilt. Das Bestätigungsfoto wird direkt nach der Aufnahme wieder gelöscht. Mooove nimmt keinen Ton auf.',
    },
    lokaal: {
      kop: 'Nur auf deinem Gerät',
      a1: 'Ein eigener Alarmton, den du auswählst, bleibt auf deinem Gerät und wird nicht an uns gesendet. Dasselbe gilt für die lokale Kopie deiner Alarme und deines Fortschritts, die Mooove speichert, damit die App auch ohne Internet funktioniert.',
    },
    foutrapporten: {
      kop: 'Fehlerberichte',
      a1: 'Stürzt die App ab, kann Mooove einen technischen Fehlerbericht an Sentry (Server in der EU) senden. Ein solcher Bericht enthält den Gerätetyp, die App-Version und die Stelle des Fehlers, aber keinen Namen, keine E-Mail-Adresse, keine IP-Adresse und keine Kamerabilder, und er ist nicht mit deinem Konto verknüpft. Berichte werden nach höchstens 90 Tagen gelöscht.',
    },
    nietDoen: {
      kop: 'Was wir nicht tun',
      p1: 'Wir zeigen keine Werbung und nutzen keine Werbe- oder Tracking-Dienste.',
      p2: 'Wir verkaufen deine Daten nicht und geben sie nicht zu Marketingzwecken an Dritte weiter.',
      p3: 'Wir verarbeiten keine Gesundheits- oder medizinischen Daten.',
    },
    verwerkers: {
      kop: 'Auftragsverarbeiter',
      a1: 'Deine Daten werden bei Supabase (Datenbank und Anmeldung) in einem Rechenzentrum in der Europäischen Union (Frankfurt, Deutschland) gespeichert. Fehlerberichte gehen an Sentry, ebenfalls in der EU. Beide verarbeiten die Daten ausschließlich in unserem Auftrag.',
    },
    grondslag: {
      kop: 'Rechtsgrundlage',
      a1: 'Wir verarbeiten deine Daten, weil dies nötig ist, um dir die App bereitzustellen (Vertragserfüllung, Art. 6 Abs. 1 lit. b DSGVO).',
    },
    rechten: {
      kop: 'Deine Rechte',
      a1: 'Du hast das Recht, deine Daten einzusehen, zu berichtigen und löschen zu lassen. Über Profil → Meine Daten herunterladen bekommst du sofort eine Kopie all deiner Daten. Du kannst dein Konto und all deine Daten jederzeit selbst über Profil → Konto löschen entfernen. Alle Daten werden dann sofort und endgültig gelöscht.',
      a2: 'Hast du eine Beschwerde darüber, wie wir mit deinen Daten umgehen? Du kannst dich auch bei der niederländischen Datenschutzbehörde (Autoriteit Persoonsgegevens) beschweren.',
    },
    beveiliging: {
      kop: 'Sicherheit',
      a1: 'Daten werden verschlüsselt übertragen (HTTPS). Deine Sitzung wird verschlüsselt auf deinem Gerät gespeichert. In der Datenbank kann jede Person nur auf ihre eigenen Daten zugreifen.',
    },
    contact: {
      kop: 'Kontakt',
      a1: 'Hylke Thiry — hylke@linkandlead.nl',
    },
  },
  fr: {
    kicker: 'TES DONNÉES',
    titel: 'Confidentialité',
    bijgewerkt: 'Dernière mise à jour : {{datum}}',
    voorrang:
      'Ceci est une traduction de la politique de confidentialité néerlandaise. En cas de divergence, la version néerlandaise prévaut.',
    over: {
      kop: 'À propos de cette politique',
      a1: 'Mooove est une app de réveil qui t’aide à te mettre en mouvement le matin. Mooove est proposée par Hylke Thiry (« nous »). Tu trouveras ici quelles données nous traitons, pourquoi, et quels sont tes droits.',
    },
    gegevens: {
      kop: 'Quelles données traitons-nous ?',
      a1: 'Nous conservons ces données tant que ton compte existe :',
      p1: 'Adresse e-mail : pour te connecter avec un code à usage unique et gérer ton compte.',
      p2: 'Prénom : pour te saluer dans l’app.',
      p3: 'Alarmes (heure, jours, niveau, exercices et quantités choisis, nom) : pour programmer tes alarmes et les rendre disponibles sur tous tes appareils.',
      p4: 'Résultats des missions (heure de début et de fin, exercices, nombre de répétitions, terminée ou interrompue) : pour afficher ta série, ta progression et tes badges.',
      p5: 'Objectif hebdomadaire et date de ton dernier test d’alarme réussi : pour afficher tes réglages et la vérification d’alarme.',
      p6: 'Tes missions perso (nom, icône, minuteur ou photo et durée) : pour les utiliser dans tes alarmes.',
    },
    camera: {
      kop: 'Caméra',
      a1: 'Mooove utilise la caméra pendant une mission pour reconnaître les exercices (par exemple compter les squats), pour mesurer s’il fait plus clair quand tu ouvres les rideaux, et pour prendre une photo confirmant que ton lit est fait.',
      a2: 'Ces images sont traitées uniquement sur ton propre appareil. Elles ne sont jamais enregistrées, jamais envoyées à nos serveurs et jamais partagées. La photo de confirmation est supprimée juste après avoir été prise. Mooove n’enregistre aucun son.',
    },
    lokaal: {
      kop: 'Uniquement sur ton appareil',
      a1: 'Un son d’alarme personnalisé que tu choisis reste sur ton appareil et ne nous est pas envoyé. Il en va de même pour la copie locale de tes alarmes et de ta progression, que Mooove conserve pour que l’app fonctionne aussi sans internet.',
    },
    foutrapporten: {
      kop: 'Rapports d’erreur',
      a1: 'Si l’app plante, Mooove peut envoyer un rapport d’erreur technique à Sentry (serveurs dans l’UE). Ce rapport contient le type d’appareil, la version de l’app et l’endroit où l’erreur s’est produite, mais aucun nom, adresse e-mail, adresse IP ni image de la caméra, et il n’est pas lié à ton compte. Les rapports sont supprimés au bout de 90 jours maximum.',
    },
    nietDoen: {
      kop: 'Ce que nous ne faisons pas',
      p1: 'Nous n’affichons pas de publicité et n’utilisons aucun service publicitaire ou de suivi.',
      p2: 'Nous ne vendons ni ne partageons tes données avec des tiers à des fins de marketing.',
      p3: 'Nous ne traitons aucune donnée de santé ou médicale.',
    },
    verwerkers: {
      kop: 'Sous-traitants',
      a1: 'Tes données sont stockées chez Supabase (base de données et connexion), dans un centre de données de l’Union européenne (Francfort, Allemagne). Les rapports d’erreur vont à Sentry, également dans l’UE. Tous deux traitent les données uniquement pour notre compte.',
    },
    grondslag: {
      kop: 'Base légale',
      a1: 'Nous traitons tes données parce que c’est nécessaire pour te fournir l’app (exécution du contrat, article 6, paragraphe 1, point b) du RGPD).',
    },
    rechten: {
      kop: 'Tes droits',
      a1: 'Tu as le droit d’accéder à tes données, de les rectifier et de les faire supprimer. Via Profil → Télécharger mes données, tu obtiens immédiatement une copie de toutes tes données. Tu peux supprimer toi-même ton compte et toutes tes données à tout moment via Profil → Supprimer le compte. Toutes les données sont alors effacées immédiatement et définitivement.',
      a2: 'Tu as une réclamation sur la façon dont nous traitons tes données ? Tu peux aussi déposer une plainte auprès de l’autorité néerlandaise de protection des données (Autoriteit Persoonsgegevens).',
    },
    beveiliging: {
      kop: 'Sécurité',
      a1: 'Les données sont transmises de façon chiffrée (HTTPS). Ta session est conservée chiffrée sur ton appareil. Dans la base de données, chaque utilisateur ne peut accéder qu’à ses propres données.',
    },
    contact: {
      kop: 'Contact',
      a1: 'Hylke Thiry — hylke@linkandlead.nl',
    },
  },
};
