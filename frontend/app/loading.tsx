import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { classifyWasteInput } from '@/services/api';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

const STEPS: { label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
  { label: 'Identifying item...', icon: 'sync' },
  { label: 'Checking local rules...', icon: 'place' },
  { label: 'Preparing guidance...', icon: 'check-circle-outline' },
];

const STEP_DELAYS = [4000, 10000];

export default function LoadingScreen() {
  const params = useLocalSearchParams<{ image_base64?: string; message?: string; location?: string }>();
  const [activeStep, setActiveStep] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Main ring spin
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Step progression
  useEffect(() => {
    const timers = STEP_DELAYS.map((delay, i) =>
      setTimeout(() => setActiveStep(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // API call
  useEffect(() => {
    const classify = async () => {
      try {
        const response = await classifyWasteInput({
          image_base64: params.image_base64 ?? null,
          message: params.message ?? null,
          location: params.location ?? null,
        });
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

        {/* Title + subtitle */}
        <Text style={styles.title}>Analyzing</Text>
        <Text style={styles.subtitle}>"{itemLabel}"</Text>

        {/* Steps */}
        <View style={styles.steps}>
          {STEPS.map((step, i) => {
            const isActive = activeStep === i;
            return (
              <View key={i} style={[styles.stepRow, isActive && styles.stepRowActive]}>
                {isActive ? (
                  <ActivityIndicator size={20} color={COLORS.primary} />
                ) : (
                  <MaterialIcons
                    name={step.icon}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                )}
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
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

  // Steps
  steps: {
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  stepRowActive: {
    backgroundColor: COLORS.accentLight,
  },
  stepLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  stepLabelActive: {
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});
