// Kalibratie van de telregels per toestel, gemeten in de proefronde. Alleen soepeler dan de
// standaard: wie minder diep zakt, krijgt een squat toch geteld (tot een redelijke grens).
export type Kalibratie = { squatGrens?: number };

export const STANDAARD_SQUAT_GRENS = 110;
const MAX_SQUAT_GRENS = 135;
// Marge boven de diepste gemeten kniehoek, zodat je niet elke keer even diep hoeft
const MARGE = 12;

// Kniehoek waaronder een squat telt, uit de diepste hoek die in de proefronde is gemeten
export function squatGrens(diepste: number): number {
  return Math.min(MAX_SQUAT_GRENS, Math.max(STANDAARD_SQUAT_GRENS, Math.round(diepste + MARGE)));
}
