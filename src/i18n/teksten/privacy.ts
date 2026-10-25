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
    p1: 'E-mailadres (alleen als je inlogt met e-mail of er een koppelt; zonder account is het niet nodig): om in te loggen met een eenmalige code en je account te beheren.',
    p2: 'Voornaam: om je in de app te begroeten.',
    p3: 'Alarmen (tijd, dagen, niveau, gekozen oefeningen en aantallen, naam): om je alarmen in te plannen en op al je toestellen beschikbaar te maken.',
    p4: 'Missieresultaten (start- en eindtijd, oefeningen, aantal herhalingen, voltooid of afgebroken): om je streak, voortgang en badges te tonen.',
    p5: 'Weekdoel en datum van je laatste geslaagde alarmtest: om je instellingen en alarm-check te tonen.',
    p6: 'Eigen missies (naam, icoon, timer of foto en duur): om ze in je alarmen te gebruiken.',
    p7: 'Ochtendgevoel na een missie (moe, oké of sterk; alleen als je het invult): om je trend in Progressie te tonen.',
    p8: 'Feedback die je in de app stuurt (soort, bericht, appversie en type toestel): om je vraag te beantwoorden en de app te verbeteren.',
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
  beheer: {
    kop: 'Beheer',
    a1: 'Alleen de aanbieder van Mooove kan in een beveiligde beheeromgeving zien welke accounts er zijn: e-mailadres, voornaam, wanneer je je hebt aangemeld en voor het laatst actief was, en hoeveel alarmen en missies je hebt. Dit gebruiken we alleen voor ondersteuning en om de app te verbeteren. Camerabeelden en de inhoud van je eigen missies zijn daar nooit zichtbaar.',
  },
  wachtlijst: {
    kop: 'Wachtlijst op de website',
    a1: 'Meld je je op mooove-app.com aan voor de wachtlijst, dan bewaren we je e-mailadres en taal om je één keer te laten weten dat Mooove beschikbaar is. Daarna, of eerder als je dat vraagt via hylke@linkandlead.nl, verwijderen we je adres. Om misbruik te voorkomen bewaren we maximaal twee dagen een onleesbaar gemaakte code (hash) van je IP-adres, nooit het adres zelf.',
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
      p1: 'Email address (only if you log in with email or link one; not needed without an account): to log in with a one-time code and manage your account.',
      p2: 'First name: to greet you in the app.',
      p3: 'Alarms (time, days, level, chosen exercises and amounts, name): to schedule your alarms and make them available on all your devices.',
      p4: 'Mission results (start and end time, exercises, number of reps, completed or stopped): to show your streak, progress and badges.',
      p5: 'Weekly goal and the date of your last successful alarm test: to show your settings and alarm check.',
      p6: 'Your own missions (name, icon, timer or photo and duration): to use them in your alarms.',
      p7: 'Morning mood after a mission (tired, okay or strong; only if you fill it in): to show your trend in Progress.',
      p8: 'Feedback you send in the app (type, message, app version and device type): to answer your question and improve the app.',
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
    beheer: {
      kop: 'Administration',
      a1: 'Only the provider of Mooove can see, in a secured admin area, which accounts exist: email address, first name, when you signed up and were last active, and how many alarms and missions you have. We use this only for support and to improve the app. Camera images and the content of your own missions are never visible there.',
    },
    wachtlijst: {
      kop: 'Waiting list on the website',
      a1: 'If you join the waiting list on mooove-app.com, we keep your email address and language to let you know once that Mooove is available. After that, or earlier if you ask via hylke@linkandlead.nl, we delete your address. To prevent abuse, we keep an unreadable code (hash) of your IP address for at most two days, never the address itself.',
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
      p1: 'Correo electrónico (solo si inicias sesión con correo o vinculas uno; sin cuenta no es necesario): para iniciar sesión con un código de un solo uso y gestionar tu cuenta.',
      p2: 'Nombre: para saludarte en la app.',
      p3: 'Alarmas (hora, días, nivel, ejercicios y cantidades elegidos, nombre): para programar tus alarmas y tenerlas disponibles en todos tus dispositivos.',
      p4: 'Resultados de las misiones (hora de inicio y fin, ejercicios, número de repeticiones, completada o interrumpida): para mostrar tu racha, tu progreso y tus insignias.',
      p5: 'Objetivo semanal y fecha de tu última prueba de alarma superada: para mostrar tus ajustes y la comprobación de alarma.',
      p6: 'Tus misiones propias (nombre, icono, temporizador o foto y duración): para usarlas en tus alarmas.',
      p7: 'Ánimo tras una misión (cansado, bien o fuerte; solo si lo indicas): para mostrar tu tendencia en Progreso.',
      p8: 'Comentarios que envías desde la app (tipo, mensaje, versión de la app y tipo de dispositivo): para responderte y mejorar la app.',
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
    beheer: {
      kop: 'Administración',
      a1: 'Solo el proveedor de Mooove puede ver, en un área de administración protegida, qué cuentas existen: correo electrónico, nombre, cuándo te registraste y tu última actividad, y cuántas alarmas y misiones tienes. Solo lo usamos para dar soporte y mejorar la app. Las imágenes de la cámara y el contenido de tus misiones propias nunca son visibles allí.',
    },
    wachtlijst: {
      kop: 'Lista de espera en la web',
      a1: 'Si te apuntas a la lista de espera en mooove-app.com, guardamos tu correo y tu idioma para avisarte una vez de que Mooove está disponible. Después, o antes si lo pides en hylke@linkandlead.nl, borramos tu dirección. Para evitar abusos guardamos como máximo dos días un código ilegible (hash) de tu dirección IP, nunca la dirección en sí.',
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
      p1: 'E-Mail-Adresse (nur wenn du dich per E-Mail anmeldest oder eine verknüpfst; ohne Konto nicht nötig): um dich mit einem einmaligen Code anzumelden und dein Konto zu verwalten.',
      p2: 'Vorname: um dich in der App zu begrüßen.',
      p3: 'Alarme (Uhrzeit, Tage, Stufe, gewählte Übungen und Anzahl, Name): um deine Alarme zu planen und auf all deinen Geräten verfügbar zu machen.',
      p4: 'Missionsergebnisse (Start- und Endzeit, Übungen, Anzahl der Wiederholungen, abgeschlossen oder abgebrochen): um deine Serie, deinen Fortschritt und deine Abzeichen anzuzeigen.',
      p5: 'Wochenziel und Datum deines letzten erfolgreichen Alarmtests: um deine Einstellungen und den Alarm-Check anzuzeigen.',
      p6: 'Eigene Missionen (Name, Symbol, Timer oder Foto und Dauer): um sie in deinen Weckern zu verwenden.',
      p7: 'Morgenstimmung nach einer Mission (müde, okay oder stark; nur wenn du sie angibst): um deinen Verlauf unter Fortschritt zu zeigen.',
      p8: 'Feedback, das du in der App sendest (Art, Nachricht, App-Version und Gerätetyp): um deine Frage zu beantworten und die App zu verbessern.',
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
    beheer: {
      kop: 'Verwaltung',
      a1: 'Nur der Anbieter von Mooove kann in einem geschützten Verwaltungsbereich sehen, welche Konten es gibt: E-Mail-Adresse, Vorname, wann du dich registriert hast und zuletzt aktiv warst und wie viele Wecker und Missionen du hast. Wir nutzen das nur für den Support und um die App zu verbessern. Kamerabilder und der Inhalt deiner eigenen Missionen sind dort nie sichtbar.',
    },
    wachtlijst: {
      kop: 'Warteliste auf der Website',
      a1: 'Wenn du dich auf mooove-app.com für die Warteliste einträgst, speichern wir deine E-Mail-Adresse und Sprache, um dir einmal mitzuteilen, dass Mooove verfügbar ist. Danach, oder früher auf Wunsch über hylke@linkandlead.nl, löschen wir deine Adresse. Zum Schutz vor Missbrauch speichern wir höchstens zwei Tage einen unlesbaren Code (Hash) deiner IP-Adresse, nie die Adresse selbst.',
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
      p1: 'Adresse e-mail (uniquement si tu te connectes par e-mail ou en lies une ; inutile sans compte) : pour te connecter avec un code à usage unique et gérer ton compte.',
      p2: 'Prénom : pour te saluer dans l’app.',
      p3: 'Alarmes (heure, jours, niveau, exercices et quantités choisis, nom) : pour programmer tes alarmes et les rendre disponibles sur tous tes appareils.',
      p4: 'Résultats des missions (heure de début et de fin, exercices, nombre de répétitions, terminée ou interrompue) : pour afficher ta série, ta progression et tes badges.',
      p5: 'Objectif hebdomadaire et date de ton dernier test d’alarme réussi : pour afficher tes réglages et la vérification d’alarme.',
      p6: 'Tes missions perso (nom, icône, minuteur ou photo et durée) : pour les utiliser dans tes alarmes.',
      p7: 'Humeur après une mission (fatigué, bien ou en forme ; seulement si tu l’indiques) : pour afficher ta tendance dans Progrès.',
      p8: 'Avis envoyés depuis l’app (type, message, version de l’app et type d’appareil) : pour te répondre et améliorer l’app.',
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
    beheer: {
      kop: 'Administration',
      a1: 'Seul le fournisseur de Mooove peut voir, dans un espace d’administration sécurisé, quels comptes existent : adresse e-mail, prénom, date d’inscription et dernière activité, et nombre d’alarmes et de missions. Nous l’utilisons uniquement pour l’assistance et pour améliorer l’app. Les images de la caméra et le contenu de tes missions personnalisées n’y sont jamais visibles.',
    },
    wachtlijst: {
      kop: 'Liste d’attente sur le site',
      a1: 'Si tu t’inscris sur la liste d’attente de mooove-app.com, nous gardons ton adresse e-mail et ta langue pour te prévenir une fois que Mooove est disponible. Ensuite, ou plus tôt si tu le demandes via hylke@linkandlead.nl, nous supprimons ton adresse. Pour éviter les abus, nous gardons au maximum deux jours un code illisible (hash) de ton adresse IP, jamais l’adresse elle-même.',
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
  zh: {
    kicker: '你的数据',
    titel: '隐私',
    bijgewerkt: '最后更新：{{datum}}',
    voorrang: '本文是荷兰语隐私政策的翻译。如有任何差异，以荷兰语版本为准。',
    over: {
      kop: '关于本政策',
      a1: 'Mooove 是一款帮助你早晨动起来的闹钟应用，由 Hylke Thiry（“我们”）提供。在这里你可以了解我们处理哪些数据、为什么处理，以及你拥有哪些权利。',
    },
    gegevens: {
      kop: '我们处理哪些数据？',
      a1: '只要你的账户存在，我们就会保留以下数据：',
      p1: '邮箱地址（仅在你用邮箱登录或关联邮箱时；不注册则无需提供）：用于通过一次性验证码登录和管理你的账户。',
      p2: '名字：用于在应用中向你问好。',
      p3: '闹钟（时间、日期、等级、所选运动及数量、名称）：用于安排你的闹钟，并让它们在你的所有设备上可用。',
      p4: '任务结果（开始和结束时间、运动、次数、已完成或已中止）：用于显示你的连续纪录、进度和徽章。',
      p5: '每周目标及最近一次成功测试闹钟的日期：用于显示你的设置和闹钟检查。',
      p6: '你的自定义任务（名称、图标、计时或照片及时长）：用于在你的闹钟中使用。',
      p7: '任务后的早晨状态（累、还行或很棒；仅在你填写时）：用于在“进度”中显示你的趋势。',
      p8: '你在应用中发送的反馈（类型、消息、应用版本和设备类型）：用于回答你的问题并改进应用。',
    },
    camera: {
      kop: '相机',
      a1: '在任务过程中，Mooove 使用相机识别运动（例如计算深蹲次数）、检测拉开窗帘后光线是否变亮，以及拍摄一张确认床铺已整理好的照片。',
      a2: '这些画面只在你自己的设备上处理。它们绝不会被保存、绝不会发送到我们的服务器，也绝不会与任何人分享。确认照片拍摄后会立即删除。Mooove 不会录制任何声音。',
    },
    lokaal: {
      kop: '只保存在你的设备上',
      a1: '你选择的自定义闹钟铃声保留在你的设备上，不会发送给我们。你的闹钟和进度的本地副本也是如此，Mooove 保留它是为了让应用在没有网络时也能使用。',
    },
    foutrapporten: {
      kop: '错误报告',
      a1: '如果应用崩溃，Mooove 可能会向 Sentry（服务器位于欧盟）发送一份技术错误报告。报告包含设备类型、应用版本和出错位置，但不包含姓名、邮箱地址、IP 地址或相机画面，也不会与你的账户关联。报告最多保留 90 天后删除。',
    },
    nietDoen: {
      kop: '我们不做的事',
      p1: '我们不展示广告，也不使用任何广告或追踪服务。',
      p2: '我们不会出售你的数据，也不会为营销目的与第三方分享。',
      p3: '我们不处理任何健康或医疗数据。',
    },
    verwerkers: {
      kop: '数据处理方',
      a1: '你的数据存储在 Supabase（数据库和登录），位于欧盟的数据中心（德国法兰克福）。错误报告发送至同样位于欧盟的 Sentry。两者仅代表我们处理数据。',
    },
    beheer: {
      kop: '后台管理',
      a1: '只有 Mooove 的提供者能在受保护的管理后台中看到存在哪些账户：邮箱地址、名字、注册时间和最近活跃时间，以及你有多少个闹钟和任务。我们仅将其用于提供支持和改进应用。相机画面和自定义任务的内容在那里永远不可见。',
    },
    wachtlijst: {
      kop: '网站上的等候名单',
      a1: '如果你在 mooove-app.com 上加入等候名单，我们会保存你的邮箱地址和语言，以便在 Mooove 上线时通知你一次。之后，或在你通过 hylke@linkandlead.nl 提出要求时更早，我们会删除你的地址。为防止滥用，我们会保存你 IP 地址的不可读代码（哈希值）最多两天，绝不保存地址本身。',
    },
    grondslag: {
      kop: '法律依据',
      a1: '我们处理你的数据，是因为这是向你提供应用所必需的（履行合同，《通用数据保护条例》（GDPR）第 6 条第 1 款 (b) 项）。',
    },
    rechten: {
      kop: '你的权利',
      a1: '你有权查阅、更正和删除你的数据。通过“我的 → 下载我的数据”，你可以立即获得全部数据的副本。你可以随时通过“我的 → 删除账户”自行删除账户及所有数据，所有数据将立即永久清除。',
      a2: '对我们处理你数据的方式有投诉？你也可以向荷兰数据保护局（Autoriteit Persoonsgegevens）投诉。',
    },
    beveiliging: {
      kop: '安全',
      a1: '数据以加密方式传输（HTTPS）。你的会话以加密方式存储在你的设备上。在数据库中，每位用户只能访问自己的数据。',
    },
    contact: {
      kop: '联系方式',
      a1: 'Hylke Thiry — hylke@linkandlead.nl',
    },
  },
};
