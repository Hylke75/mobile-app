export type Niveau = 'Vrij' | 'Flexibel' | 'Uitstelbaar' | 'Verplicht' | 'Hardcore';

// Ingebouwde missies; de Nederlandse namen zijn ook de sleutels in de database
export type Oefening =
  | 'Squats'
  | 'Push-ups'
  | 'Jumping jacks'
  | 'Plank'
  | 'Lunges'
  | 'Kuitheffen'
  | 'Bruggetje'
  | 'Muurzit'
  | 'Zijplank'
  | 'Boomhouding'
  | 'Bed opmaken'
  | 'Gordijnen open'
  | 'Glas water'
  | 'Tanden poetsen'
  | 'Ademhaling'
  | 'Stretchen';

// Zelfgemaakte missie van de gebruiker, afgerond met een timer of een foto
export type EigenMissie = {
  id: string;
  naam: string;
  emoji: string;
  soort: 'timer' | 'foto';
  duurSeconden: number;
};

// Een missie in een alarm: een ingebouwde oefening of "eigen:<uuid>"
export type MissieId = Oefening | `eigen:${string}`;

// Eigen aantal herhalingen of seconden per oefening; ontbrekend = standaarddoel
export type Doelen = Partial<Record<Oefening, number>>;

export type Alarm = {
  id: string;
  naam: string;
  tijd: string;
  // 0 = maandag … 6 = zondag
  dagen: number[];
  niveau: Niveau;
  oefeningen: MissieId[];
  doelen: Doelen;
  aan: boolean;
  // Datum (YYYY-MM-DD) waarop dit alarm één keer niet afgaat
  overslaanOp?: string | null;
  // Elke ochtend één missie uit de lijst in plaats van allemaal
  wisselend?: boolean;
  // Niet afgaan op officiële feestdagen van het land van het toestel
  feestdagenOverslaan?: boolean;
};

export type StapResultaat = {
  oefening: MissieId;
  doel: number;
  gedaan: number;
  methode: 'camera' | 'licht' | 'foto' | 'timer' | 'beweging' | 'handmatig';
};

export type Sessie = {
  id: string;
  alarmId: string | null;
  gestartOp: Date;
  afgerondOp: Date;
  status: 'voltooid' | 'afgebroken';
  stappen: StapResultaat[];
  totaalHerhalingen: number;
  // Hoe je je voelde na de missie: 1 = moe, 2 = oké, 3 = sterk
  gevoel?: number | null;
};
