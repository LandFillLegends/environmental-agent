/**
 * Reusable camera component for capturing waste item photos.
 *
 * Usage:
 *   <WasteCamera
 *     onCapture={(base64) => sendToBackend(base64)}
 *     onClose={() => goBack()}
 *   />
 *
 * This component handles:
 * - Camera permissions (request + denied state)
 * - Live camera preview
 * - Capture button with haptic feedback
 * - Camera flip (front/back)
 * - Close button
 */

import { useRef, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface WasteCameraProps {
  /** Called with the base64-encoded image string after capture */
  onCapture: (base64Image: string) => void;
  /** Called when the user taps the close button */
  onClose: () => void;
}

export function WasteCamera({ onCapture, onClose }: WasteCameraProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // Permission state is loading
  if (!permission) {
    return <ThemedView style={styles.container} />;
  }

  // Permission denied — show a message and a button to request again
  if (!permission.granted) {
    return (
      <ThemedView style={styles.permissionContainer}>
        <IconSymbol name="camera.fill" size={64} color="#687076" />
        <ThemedText type="subtitle" style={styles.permissionTitle}>
          Camera Access Needed
        </ThemedText>
        <ThemedText style={styles.permissionMessage}>
          We need camera access to photograph waste items for classification.
        </ThemedText>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <ThemedText style={styles.permissionButtonText}>Grant Permission</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Take a picture and pass the base64 data to the parent
  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7, // 70% quality — good balance between size and clarity
      });

      if (photo?.base64) {
        onCapture(photo.base64);
      } else {
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Something went wrong while taking the picture.');
    }
  };

  const toggleFacing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        {/* Overlay controls on top of the camera preview */}
        <View style={styles.overlay}>
          {/* Close button — top right */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <IconSymbol name="xmark" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Guide text */}
          <View style={styles.guideContainer}>
            <ThemedText style={styles.guideText}>
              Point at waste items and tap the button
            </ThemedText>
          </View>

          {/* Bottom controls — flip + capture */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.flipButton} onPress={toggleFacing}>
              <IconSymbol name="arrow.triangle.2.circlepath.camera" size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            {/* Spacer to center the capture button */}
            <View style={{ width: 48 }} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideContainer: {
    alignItems: 'center',
  },
  guideText: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    overflow: 'hidden',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 30,
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
  },
  // Permission screens
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  permissionTitle: {
    marginTop: 8,
  },
  permissionMessage: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 10,
  },
  cancelButtonText: {
    opacity: 0.6,
    fontSize: 15,
  },
});
