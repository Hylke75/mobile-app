// Kalibratie: alleen soepeler dan de standaard en nooit oneindig ruim.
import { squatGrens, STANDAARD_SQUAT_GRENS } from '@/lib/kalibratie';

it('houdt de standaard aan voor wie diep genoeg zakt', () => {
  expect(squatGrens(70)).toBe(STANDAARD_SQUAT_GRENS);
  expect(squatGrens(98)).toBe(STANDAARD_SQUAT_GRENS);
});

it('wordt soepeler voor wie minder diep zakt, tot 135°', () => {
  expect(squatGrens(112)).toBe(124);
  expect(squatGrens(150)).toBe(135);
});
