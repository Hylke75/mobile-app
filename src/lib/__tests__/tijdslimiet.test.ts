// Een native actie die niet antwoordt, mag een scherm nooit laten hangen.
jest.mock('@/lib/fouten', () => ({ meldFout: jest.fn() }));

// eslint-disable-next-line import/first
import { meldFout } from '@/lib/fouten';
// eslint-disable-next-line import/first
import { metTijdslimiet } from '@/lib/tijdslimiet';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('geeft het antwoord door als dat op tijd komt', async () => {
  await expect(metTijdslimiet(Promise.resolve('ok'), 3000, 'x')).resolves.toBe('ok');
  expect(meldFout).not.toHaveBeenCalled();
});

it('gaat na de limiet verder en meldt het', async () => {
  const resultaat = metTijdslimiet(new Promise(() => {}), 3000, 'hangt');
  jest.advanceTimersByTime(3000);
  await expect(resultaat).resolves.toBeUndefined();
  expect(meldFout).toHaveBeenCalledTimes(1);
});
