import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAppStore } from "@/store/useAppStore";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "@/constants/theme";
import { DISPOSAL_CATEGORIES } from '@/constants/disposal';

type ProcessingStepDef = {
  id: number;
  text: string;
  duration: number;
};

const PROCESSING_STEPS: ProcessingStepDef[] = [
  { id: 1, text: "🔍 Identifying item...", duration: 1500 },
  { id: 2, text: "📍 Checking local regulations...", duration: 1500 },
  { id: 3, text: "🗺️ Finding nearby facilities...", duration: 1500 },
  { id: 4, text: "✨ Generating recommendations...", duration: 1000 },
];

type RegulationSource = {
  title: string;
  url: string;
};

type DisposalResult = {
  item: string | null;
  category: "recycle" | "trash" | "compost" | "dropoff" | string;
  instructions: string[];
  reasoning: string;
  regulationSource?: RegulationSource;
  requiresDropoff: boolean;
  confidence: number;
};

type StepRowProps = {
  text: string;
  isActive: boolean;
  isComplete: boolean;
};

function ProcessingStep({ text, isActive, isComplete }: StepRowProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive || isComplete) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, isComplete, opacity]);

  return (
    <Animated.View
      style={[
        styles.step,
        { opacity },
        isActive && styles.stepActive,
        isComplete && styles.stepComplete,
      ]}
    >
      <View style={styles.stepIndicator}>
        {isComplete ? (
          <Text style={styles.stepCheck}>✓</Text>
        ) : isActive ? (
          <View style={styles.stepDot} />
        ) : (
          <View style={styles.stepDotInactive} />
        )}
      </View>

      <Text
        style={[
          styles.stepText,
          isActive && styles.stepTextActive,
          isComplete && styles.stepTextComplete,
        ]}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

export default function Processing() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const currentItem = useAppStore((s) => s.currentItem);
  const setDisposalResult = useAppStore((s) => s.setDisposalResult);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const totalDuration = useMemo(() => {
    return PROCESSING_STEPS.reduce((sum, s) => sum + s.duration, 0);
  }, []);

  useEffect(() => {
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Step through processing stages
    let totalTime = 0;
    PROCESSING_STEPS.forEach((step, index) => {
      totalTime += step.duration;
      const t = setTimeout(() => setCurrentStep(index + 1), totalTime);
      timeoutsRef.current.push(t);
    });

    // Navigate to results after processing
    const finalTimeout = setTimeout(() => {
      const mockResult: DisposalResult = {
        item: currentItem ?? null,
        category: "recycle",
        instructions: [
          "Remove cap and rinse bottle",
          "Check for recycling symbol #1 or #2",
          "Place in blue recycling bin",
          "Do not bag plastic bottles",
        ],
        reasoning:
          "This plastic water bottle is made from PET plastic (#1), which is widely recyclable in Seattle. Your local facility accepts clean PET bottles.",
        regulationSource: {
          title: "Seattle Public Utilities - Recycling Guidelines",
          url: "https://www.seattle.gov/utilities/recycling",
        },
        requiresDropoff: false,
        confidence: 0.95,
      };

      setDisposalResult(mockResult);

      // If Results lives in (main), use that path. If it's in tabs, change accordingly.
      router.replace("/(main)/results");
    }, totalDuration + 500);

    timeoutsRef.current.push(finalTimeout);

    return () => {
      // Cleanup timers if user navigates away mid-process
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [currentItem, fadeAnim, router, setDisposalResult, totalDuration]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Animation Area */}
        <View style={styles.animationContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.processingIcon}>🌍</Text>
          </View>

          <View style={styles.loadingBar}>
            <View
              style={[
                styles.loadingProgress,
                { width: `${(currentStep / PROCESSING_STEPS.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Status Messages */}
        <View style={styles.statusContainer}>
          <Text style={styles.mainStatus}>Analyzing Your Item</Text>
          <Text style={styles.itemName}>"{currentItem ?? ""}"</Text>

          <View style={styles.stepsContainer}>
            {PROCESSING_STEPS.map((step, index) => (
              <ProcessingStep
                key={step.id}
                text={step.text}
                isActive={currentStep === index + 1}
                isComplete={currentStep > index}
              />
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Our AI is analyzing your item against local disposal regulations
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SPACING.lg, justifyContent: "space-around" },
  animationContainer: { alignItems: "center", gap: SPACING.xl },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  processingIcon: { fontSize: 64 },
  loadingBar: {
    width: "80%",
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.round,
    overflow: "hidden",
  },
  loadingProgress: {
    height: "100%",
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.round,
  },
  statusContainer: { alignItems: "center", gap: SPACING.md },
  mainStatus: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: "center",
  },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  stepsContainer: { width: "100%", gap: SPACING.sm, marginTop: SPACING.lg },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  stepActive: { backgroundColor: COLORS.accentLight },
  stepComplete: { backgroundColor: "transparent" },
  stepIndicator: { width: 24, height: 24, justifyContent: "center", alignItems: "center" },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  stepDotInactive: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.border },
  stepCheck: { fontSize: 16, color: COLORS.success },
  stepText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.textLight },
  stepTextActive: { color: COLORS.text, fontWeight: TYPOGRAPHY.fontWeight.medium },
  stepTextComplete: { color: COLORS.textSecondary },
  infoBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});