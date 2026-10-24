export type Niveau = 'Vrij' | 'Flexibel' | 'Uitstelbaar' | 'Verplicht' | 'Hardcore';

export type Oefening =
  'Squats' | 'Push-ups' | 'Jumping jacks' | 'Plank' | 'Bed opmaken' | 'Gordijnen open';

// Eigen aantal herhalingen of seconden per oefening; ontbrekend = standaarddoel
export type Doelen = Partial<Record<Oefening, number>>;

export type Alarm = {
  id: string;
  naam: string;
  tijd: string;
  // 0 = maandag … 6 = zondag
  dagen: number[];
  niveau: Niveau;
  oefeningen: Oefening[];
  doelen: Doelen;
  aan: boolean;
};

export type StapResultaat = {
  oefening: Oefening;
  doel: number;
  gedaan: number;
  methode: 'camera' | 'licht' | 'foto' | 'beweging' | 'handmatig';
};

export type Sessie = {
  id: string;
  alarmId: string | null;
  gestartOp: Date;
  afgerondOp: Date;
  status: 'voltooid' | 'afgebroken';
  stappen: StapResultaat[];
  totaalHerhalingen: number;
};
