export type CameraStatus = 'toegestaan' | 'geweigerd' | 'onbekend';

export function cameraStatus(): CameraStatus {
  return 'geweigerd';
}

export async function vraagCameraAan(): Promise<boolean> {
  return false;
}
