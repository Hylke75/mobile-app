export type Niveau = 'Vrij' | 'Flexibel' | 'Uitstelbaar' | 'Verplicht' | 'Hardcore';

export type Alarm = {
  id: number;
  time: string;
  name: string;
  days: string;
  level: Niveau;
  count: string;
  on: boolean;
};

export type MissieTaak = {
  title: string;
  description: string;
  total: number;
  voice: string[];
};
