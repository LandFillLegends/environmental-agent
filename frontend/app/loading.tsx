import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { classifyWasteStream } from '@/services/api';

export default function LoadingScreen() {
  const params = useLocalSearchParams<{ image_base64?: string; message?: string; location?: string }>();
  const [currentLabel, setCurrentLabel] = useState('Analyzing your item...');
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Main ring spin
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  // API call — label updates from real SSE events as each pipeline node completes
  useEffect(() => {
    const classify = async () => {
      try {
        const response = await classifyWasteStream(
          {
            image_base64: params.image_base64 ?? null,
            message: params.message ?? null,
            location: params.location ?? null,
          },
          (_step, label) => {
            if (label) setCurrentLabel(label);
          },
        );
        router.replace({
          pathname: '/(main)/results',
          params: { result: JSON.stringify(response) },
        });
      } catch (error) {
        console.error('Classification error:', error);
        router.back();
        alert(error instanceof Error ? error.message : 'Classification failed. Please try again.');
      }
    };
    classify();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const itemLabel = params.message ?? (params.image_base64 ? 'Image' : 'Item');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Ring spinner */}
        <View style={styles.spinnerWrap}>
          <View style={styles.spinnerTrack} />
          <Animated.View style={[styles.spinnerArc, { transform: [{ rotate: spin }] }]} />
        </View>

        {/* Dynamic status from stream */}
        <Text style={styles.title}>{currentLabel}</Text>
        <Text style={styles.subtitle}>"{itemLabel}"</Text>
      </View>
    </SafeAreaView>
  );
}

const RING_SIZE = 90;
const RING_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },

  // Ring spinner
  spinnerWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerTrack: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_THICKNESS,
    borderColor: COLORS.border,
  },
  spinnerArc: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_THICKNESS,
    borderColor: 'transparent',
    borderTopColor: COLORS.primary,
  },

  // Text
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },

});
