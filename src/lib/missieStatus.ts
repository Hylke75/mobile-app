// Houdt bij welke missie loopt, zodat een opnieuw afgaand alarm de missie niet onderbreekt.
type ActieveMissie = { alarmId: string; vervolgId?: string };

let actief: ActieveMissie | null = null;

export function zetActieveMissie(missie: ActieveMissie | null): void {
  actief = missie;
}

export function actieveMissie(): ActieveMissie | null {
  return actief;
}

export function werkVervolgBij(alarmId: string, vervolgId: string | undefined): void {
  if (actief?.alarmId === alarmId) actief = { alarmId, vervolgId };
}
