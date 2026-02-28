/**
 * Home screen — the main entry point of the app.
 *
 * Shows a "Scan Waste" button that opens the camera modal.
 * After classification, results are displayed in a bottom sheet.
 *
 * Data flow:
 * 1. User taps "Scan Waste" → navigates to /camera modal
 * 2. Camera screen captures photo, sends to API, navigates back with results
 * 3. This screen receives results via route params and opens the bottom sheet
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import BottomSheet from '@gorhom/bottom-sheet';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ClassificationResultsSheet } from '@/components/classification-results-sheet';
import type { ClassificationResponse } from '@/types/classification';

export default function HomeScreen() {
  const params = useLocalSearchParams<{ classificationResult?: string }>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [results, setResults] = useState<ClassificationResponse | null>(null);

  // When we navigate back from the camera with results, parse and show them
  useEffect(() => {
    if (params.classificationResult) {
      try {
        const parsed: ClassificationResponse = JSON.parse(params.classificationResult);
        setResults(parsed);
        // Small delay to let the navigation animation finish before expanding the sheet
        setTimeout(() => {
          bottomSheetRef.current?.expand();
        }, 300);
      } catch (e) {
        console.error('Failed to parse classification result:', e);
      }
    }
  }, [params.classificationResult]);

  const handleScanPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/camera');
  }, []);

  const handleSheetClose = useCallback(() => {
    setResults(null);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Branding */}
        <View style={styles.header}>
          <ThemedText type="title">Landfill Legends</ThemedText>
          <ThemedText style={styles.tagline}>AI-powered waste classification</ThemedText>
        </View>

        {/* Scan button */}
        <View style={styles.scanSection}>
          <TouchableOpacity style={styles.scanButton} onPress={handleScanPress} activeOpacity={0.8}>
            <IconSymbol name="camera.fill" size={32} color="#fff" />
            <ThemedText style={styles.scanButtonText}>Scan Waste</ThemedText>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <View style={styles.infoSection}>
          <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
            How it works
          </ThemedText>
          <View style={styles.step}>
            <ThemedText style={styles.stepNumber}>1</ThemedText>
            <ThemedText style={styles.stepText}>Take a photo of waste items</ThemedText>
          </View>
          <View style={styles.step}>
            <ThemedText style={styles.stepNumber}>2</ThemedText>
            <ThemedText style={styles.stepText}>AI identifies and classifies each item</ThemedText>
          </View>
          <View style={styles.step}>
            <ThemedText style={styles.stepNumber}>3</ThemedText>
            <ThemedText style={styles.stepText}>Get disposal instructions for each item</ThemedText>
          </View>
        </View>
      </View>

      {/* Bottom sheet — renders but stays hidden until results arrive */}
      {results && (
        <ClassificationResultsSheet
          items={results.items}
          disposalInstructions={results.disposal_instructions}
          bottomSheetRef={bottomSheetRef}
          onClose={handleSheetClose}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  tagline: {
    opacity: 0.6,
    fontSize: 16,
    marginTop: 4,
  },
  scanSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  scanButton: {
    backgroundColor: '#0a7ea4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: '100%',
    maxWidth: 300,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  infoSection: {
    backgroundColor: 'rgba(10, 126, 164, 0.08)',
    padding: 20,
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0a7ea4',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
  },
});
