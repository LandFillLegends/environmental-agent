/**
 * Camera modal screen.
 *
 * This is an Expo Router page (file = route). Because it's registered as
 * presentation: 'fullScreenModal' in _layout.tsx, it slides up over the tabs.
 *
 * Flow:
 * 1. User sees camera preview via <WasteCamera />
 * 2. User taps capture → we get base64 image
 * 3. Navigate to the shared loading screen with the image
 */

import { router } from 'expo-router';

import { WasteCamera } from '@/components/waste-camera';

export default function CameraScreen() {
  const handleCapture = (base64Image: string) => {
    router.replace({
      pathname: '/loading',
      params: { image_base64: base64Image },
    });
  };

  const handleClose = () => {
    router.back();
  };

  return <WasteCamera onCapture={handleCapture} onClose={handleClose} />;
}
