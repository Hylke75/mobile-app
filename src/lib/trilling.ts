import * as Haptics from 'expo-haptics';

// Korte trillingen als feedback; mislukt het (geen trilmotor), dan gebeurt er niets
export function tik(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function succes(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
