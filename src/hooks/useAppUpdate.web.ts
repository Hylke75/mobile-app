// In de browser zijn er geen OTA-updates.
export function useAppUpdate(): { klaar: boolean; herstart: () => void } {
  return { klaar: false, herstart: () => {} };
}
