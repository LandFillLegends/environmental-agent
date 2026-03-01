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

import { styles } from '@/styles/index.styles';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

import { ClassificationResultsSheet } from '@/components/classification-results-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ClassificationResponse } from '@/types/classification';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const params = useLocalSearchParams<{ classificationResult?: string }>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [results, setResults] = useState<ClassificationResponse | null>(null);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const textColor = useThemeColor({}, 'text');

  // Fetch username from Supabase
  useEffect(() => {
    const fetchUsername = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoadingUser(false)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()

      if (!error && data?.username) {
        setUsername(data.username)
      }
      setLoadingUser(false)
    }

    fetchUsername()
  }, [])

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

  const handleTextSubmit = useCallback(() => {
    if (!message.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/loading',
      params: { message: message.trim() },
    });
  }, [message]);

  const handleSheetClose = useCallback(() => {
    setResults(null);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Branding */}
        <View style={styles.header}>
          {!loadingUser && username && (
            <ThemedText style={styles.greeting}>Welcome, {username}</ThemedText>
          )}
          <ThemedText type="title">Landfill Legends</ThemedText>
          <ThemedText style={styles.tagline}>AI-powered waste classification</ThemedText>
        </View>

        {/* Scan button */}
        <View style={styles.scanSection}>
          <TouchableOpacity
            style={[styles.scanButton, !!message.trim() && styles.disabledButton]}
            onPress={handleScanPress}
            activeOpacity={0.8}
            disabled={!!message.trim()}
          >
            <IconSymbol name="camera.fill" size={32} color="#fff" />
            <ThemedText style={styles.scanButtonText}>Scan Waste</ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.orText}>or</ThemedText>

        <TextInput
          style={[styles.textInput, { color: textColor }]}
          placeholder="Describe your waste item..."
          placeholderTextColor={`${textColor}80`}
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <View style={styles.scanSection}>
          <TouchableOpacity
            style={[styles.scanButton, !message.trim() && styles.disabledButton]}
            onPress={handleTextSubmit}
            disabled={!message.trim()}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.scanButtonText}>Describe Waste</ThemedText>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <View style={styles.infoSection}>
          <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
            How it works
          </ThemedText>
          <View style={styles.step}>
            <ThemedText style={styles.stepNumber}>1</ThemedText>
            <ThemedText style={styles.stepText}>Take a photo or describe your waste items</ThemedText>
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