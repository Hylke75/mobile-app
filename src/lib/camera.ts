import { VisionCamera } from 'react-native-vision-camera';

export type CameraStatus = 'toegestaan' | 'geweigerd' | 'onbekend';

export function cameraStatus(): CameraStatus {
  const status = VisionCamera.cameraPermissionStatus;
  if (status === 'authorized') return 'toegestaan';
  if (status === 'not-determined') return 'onbekend';
  return 'geweigerd';
}

export async function vraagCameraAan(): Promise<boolean> {
  return VisionCamera.requestCameraPermission();
}
