import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";

type Step = {
  id: string;
  icon: string; // emoji icon for RN
  label: string;
};

export default function ProcessingScreen() {
  // Prefer URL param first, fallback to store
  const { query } = useLocalSearchParams<{ query?: string }>();
  const currentItem = useAppStore((s) => s.currentItem);

  const itemLabel = (typeof query === "string" && query) || currentItem || "Unknown item";

  const steps = useMemo<Step[]>(
    () => [
      { id: "identify", icon: "🔎", label: "Identifying item..." },
      { id: "rules", icon: "📍", label: "Checking local rules..." },
      { id: "prep", icon: "✅", label: "Preparing guidance..." },
    ],
    []
  );

  const [currentStep, setCurrentStep] = useState(0);

  // Spinner animation
  const spin = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    spin.setValue(0);
    spinLoopRef.current = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    spinLoopRef.current.start();

    return () => {
      spinLoopRef.current?.stop();
    };
  }, [spin]);

  useEffect(() => {
    const t1 = setTimeout(() => setCurrentStep(1), 1200);
    const t2 = setTimeout(() => setCurrentStep(2), 2400);
    const t3 = setTimeout(() => {
      // Pass query via params OR rely on store
      router.replace({
        pathname: "/(main)/results",
        params: { query: itemLabel },
      });
    }, 3600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [itemLabel]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Spinner */}
        <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />

        <Text style={styles.title}>Analyzing</Text>
        <Text style={styles.subtitle}>"{itemLabel}"</Text>

        {/* Steps */}
        <View style={styles.steps}>
          {steps.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;

            return (
              <View
                key={step.id}
                style={[
                  styles.stepRow,
                  isActive && styles.stepActive,
                  isDone && styles.stepDone,
                  !isActive && !isDone && styles.stepDim,
                ]}
              >
                <Text style={styles.stepIcon}>{isActive ? "⏳" : step.icon}</Text>

                <Text
                  style={[
                    styles.stepText,
                    (isActive || isDone) ? styles.stepTextOn : styles.stepTextOff,
                  ]}
                >
                  {step.label}
                </Text>

                {isDone ? <Text style={styles.doneIcon}>✅</Text> : <View style={{ width: 18 }} />}
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },

  spinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: COLORS.surfaceDark,
    borderTopColor: COLORS.primary,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },

  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: "center",
  },

  steps: {
    width: "100%",
    maxWidth: 360,
    gap: SPACING.md,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  stepActive: { backgroundColor: COLORS.accentLight },
  stepDone: { backgroundColor: COLORS.surface },
  stepDim: { opacity: 0.45 },

  stepIcon: { fontSize: 18 },
  stepText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  stepTextOn: { color: COLORS.text },
  stepTextOff: { color: COLORS.textSecondary },

  doneIcon: { fontSize: 16 },
});
