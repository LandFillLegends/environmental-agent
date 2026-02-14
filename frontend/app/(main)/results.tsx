import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Button } from "@/components/buttons"; // or default import if needed
import { DisposalBadge } from "@/components/disposalBadge"; // or default import if needed
import { useAppStore } from "@/store/useAppStore";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/constants/theme";
import { DISPOSAL_CATEGORIES } from '@/constants/disposal';

type RegulationSource = {
  title: string;
  url: string;
};

type DisposalResult = {
  item: string;
  category: string;
  instructions: string[];
  reasoning: string;
  regulationSource?: RegulationSource;
  requiresDropoff: boolean;
  confidence: number; // 0..1
};

type HistoryEntry = {
  id: number;
  item: string;
  category: string;
  timestamp: Date;
};

type TipProps = { text: string };

function Tip({ text }: TipProps) {
  return (
    <View style={styles.tip}>
      <Text style={styles.tipBullet}>•</Text>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

export default function Results() {
  const router = useRouter();
  const [showReasoning, setShowReasoning] = useState<boolean>(false);

  const disposalResult = useAppStore((s) => s.disposalResult) as DisposalResult | null;
  const clearCurrentRequest = useAppStore((s) => s.clearCurrentRequest);
  const addToHistory = useAppStore((s) => s.addToHistory);

  if (!disposalResult) return null;

  const handleDone = () => {
    const entry: HistoryEntry = {
      id: Date.now(),
      item: disposalResult.item,
      category: disposalResult.category,
      timestamp: new Date(),
    };

    addToHistory(entry);
    clearCurrentRequest();

    // Home usually lives in tabs
    router.replace("/(tabs)/home");
    // If your Home is in (main), use: router.replace("/(main)/home");
  };

  const handleDropoff = () => {
    router.push("/(main)/dropoff");
  };

  const handleOpenSource = async () => {
    if (!disposalResult.regulationSource?.url) return;

    const url = disposalResult.regulationSource.url;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.title}>Disposal Method Found!</Text>
        </View>

        {/* Result Card */}
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.itemName}>{disposalResult.item}</Text>
            <DisposalBadge category={disposalResult.category} size="large" />
          </View>

          {/* Confidence Badge */}
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {Math.round(disposalResult.confidence * 100)}% Confident
            </Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.sectionTitle}>How to Dispose</Text>
            {disposalResult.instructions.map((instruction, index) => (
              <View key={`${instruction}-${index}`} style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>

          {/* Why Section */}
          <TouchableOpacity
            style={styles.whySection}
            onPress={() => setShowReasoning((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={styles.whyHeader}>
              <Text style={styles.whyTitle}>💡 Why this method?</Text>
              <Text style={styles.whyArrow}>{showReasoning ? "▼" : "▶"}</Text>
            </View>

            {showReasoning ? (
              <View style={styles.whyContent}>
                <Text style={styles.whyText}>{disposalResult.reasoning}</Text>

                {disposalResult.regulationSource ? (
                  <TouchableOpacity style={styles.sourceLink} onPress={handleOpenSource}>
                    <Text style={styles.sourceLinkText}>
                      📄 {disposalResult.regulationSource.title}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Drop-off Alert if needed */}
        {disposalResult.requiresDropoff ? (
          <View style={styles.dropoffAlert}>
            <Text style={styles.dropoffIcon}>📍</Text>
            <View style={styles.dropoffContent}>
              <Text style={styles.dropoffTitle}>Drop-off Required</Text>
              <Text style={styles.dropoffText}>
                This item needs to be taken to a special facility
              </Text>
            </View>
            <Button
              title="Find Locations"
              onPress={handleDropoff}
              variant="secondary"
              size="small"
            />
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          {disposalResult.requiresDropoff ? (
            <>
              <Button title="Schedule Drop-off" onPress={handleDropoff} size="large" icon="📅" />
              <Button title="Done" onPress={handleDone} variant="outline" size="medium" />
            </>
          ) : (
            <Button title="Done - Return Home" onPress={handleDone} size="large" icon="✓" />
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💚 Eco Tips</Text>
          <Tip text="Consider reusable alternatives to reduce waste" />
          <Tip text="Clean recyclables to prevent contamination" />
          <Tip text="Check with your building for specific guidelines" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg },
  header: { alignItems: "center", gap: SPACING.md },
  successIcon: { fontSize: 64 },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: "center",
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.lg,
    ...SHADOWS.md,
  },
  resultHeader: { gap: SPACING.md },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  confidenceBadge: {
    backgroundColor: COLORS.accentLight,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    alignSelf: "flex-start",
  },
  confidenceText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  instructionsSection: { gap: SPACING.md },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  instructionItem: { flexDirection: "row", gap: SPACING.md, alignItems: "flex-start" },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionNumberText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.surface,
  },
  instructionText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.text, lineHeight: 24 },
  whySection: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md },
  whyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  whyTitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.primary },
  whyArrow: { fontSize: 12, color: COLORS.textSecondary },
  whyContent: { marginTop: SPACING.md, gap: SPACING.md },
  whyText: { fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.textSecondary, lineHeight: 24 },
  sourceLink: { backgroundColor: COLORS.background, padding: SPACING.md, borderRadius: BORDER_RADIUS.sm },
  sourceLinkText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.medium },
  dropoffAlert: {
    backgroundColor: `${COLORS.warning}20`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  dropoffIcon: { fontSize: 32 },
  dropoffContent: { flex: 1 },
  dropoffTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  dropoffText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  actions: { gap: SPACING.md },
  tipsSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.md,
  },
  tipsTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  tip: { flexDirection: "row", gap: SPACING.sm },
  tipBullet: { fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.accent, fontWeight: TYPOGRAPHY.fontWeight.bold },
  tipText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, lineHeight: 20 },
});
