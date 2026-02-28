/**
 * Camera modal screen.
 *
 * This is an Expo Router page (file = route). Because it's registered as
 * presentation: 'fullScreenModal' in _layout.tsx, it slides up over the tabs.
 *
 * Flow:
 * 1. User sees camera preview via <WasteCamera />
 * 2. User taps capture → we get base64 image
 * 3. We send image to backend API
 * 4. Navigate back to home with the results
 */

import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { WasteCamera } from '@/components/waste-camera';
import { classifyWasteInput } from '@/services/api';

export default function CameraScreen() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (base64Image: string) => {
    setIsProcessing(true);

    try {
      const response = await classifyWasteInput({ image_base64: base64Image });

      // Navigate back to home and pass the results as URL params.
      // We JSON-stringify the data since Expo Router params are strings.
      router.replace({
        pathname: '/(tabs)',
        params: { classificationResult: JSON.stringify(response) },
      });
    } catch (error) {
      console.error('Classification error:', error);
      setIsProcessing(false);
      // Show error but stay on camera so user can retry
      alert(error instanceof Error ? error.message : 'Classification failed. Please try again.');
    }
  };

  const handleClose = () => {
    router.back();
  };

  // While waiting for the API response, show a loading overlay
  if (isProcessing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Analyzing waste items...</ThemedText>
        <ThemedText style={styles.loadingSubtext}>This may take a few seconds</ThemedText>
      </View>
    );
  }

  return <WasteCamera onCapture={handleCapture} onClose={handleClose} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    gap: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});
