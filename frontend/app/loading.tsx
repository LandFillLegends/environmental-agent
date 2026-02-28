/**
 * Shared loading screen for both image and text classification.
 *
 * Flow:
 * 1. Camera screen or home screen navigates here with image_base64 or message as params
 * 2. This screen calls the API
 * 3. Navigates back to home with the results
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { classifyWasteInput } from '@/services/api';

export default function LoadingScreen() {
  const params = useLocalSearchParams<{ image_base64?: string; message?: string; location?: string }>();

  useEffect(() => {
    const classify = async () => {
      try {
        const response = await classifyWasteInput({
          image_base64: params.image_base64 ?? null,
          message: params.message ?? null,
          location: params.location ?? null,
        });

        router.replace({
          pathname: '/(tabs)',
          params: { classificationResult: JSON.stringify(response) },
        });
      } catch (error) {
        console.error('Classification error:', error);
        router.back();
        alert(error instanceof Error ? error.message : 'Classification failed. Please try again.');
      }
    };

    classify();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0a7ea4" />
      <ThemedText style={styles.loadingText}>Analyzing waste items...</ThemedText>
      <ThemedText style={styles.loadingSubtext}>This may take a few seconds</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
