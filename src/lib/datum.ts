const DAGEN = ['ZONDAG', 'MAANDAG', 'DINSDAG', 'WOENSDAG', 'DONDERDAG', 'VRIJDAG', 'ZATERDAG'];
const MAANDEN = [
  'JANUARI',
  'FEBRUARI',
  'MAART',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AUGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DECEMBER',
];

// Bijvoorbeeld "VRIJDAG 23 OKTOBER"
export function datumKicker(datum = new Date()): string {
  return `${DAGEN[datum.getDay()]} ${datum.getDate()} ${MAANDEN[datum.getMonth()]}`;
}
