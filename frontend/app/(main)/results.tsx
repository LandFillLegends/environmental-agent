import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { router, useLocalSearchParams } from "expo-router";

import { Button } from "@/components/buttons";
import { DisposalBadge } from "@/components/disposalBadge";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/constants/theme";
import { DISPOSAL_CATEGORIES } from "@/constants/disposal";


type DisposalType = keyof typeof DISPOSAL_CATEGORIES;

type Result = {
  item: string;
  type: DisposalType;
  steps: string[];
  reason: string;
  source: string;
  needsDropoff: boolean;
};

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ResultsScreen() {
  const { query } = useLocalSearchParams<{ query?: string }>();
  const itemQuery = typeof query === "string" && query ? query : "Pizza Box";

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const mockResults = useMemo<Result[]>(
    () => [
      {
        item: "Pizza Box",
        type: "recycle",
        steps: [
          "Remove any leftover food or grease-soaked parts",
          "Tear off the clean lid — that part is recyclable",
          "Place the clean cardboard in your blue recycling bin",
          "Compost the greasy bottom if composting is available",
        ],
        reason:
          "Seattle Municipal Code 21.36.082 — Cardboard is accepted in curbside recycling only if clean and dry.",
        source:
          "https://www.seattle.gov/utilities/your-services/collection-and-disposal/where-does-it-go",
        needsDropoff: false,
      },
      {
        item: "Batteries (AA)",
        type: "hazardous",
        steps: [
          "Do NOT place in regular trash or recycling",
          "Tape the terminals with clear tape for safety",
          "Bring to a household hazardous waste facility",
          "Check accepted battery types at the facility",
        ],
        reason:
          "Batteries contain heavy metals and must be disposed at designated collection points per EPA guidelines.",
        source: "https://www.epa.gov/recycle/used-household-batteries",
        needsDropoff: true,
      },
    ],
    []
  );

  const toggleWhy = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIdx((prev) => (prev === idx ? null : idx));
  };

  const openSource = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      // optional: show alert
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/home")} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.subtitle}>Results for</Text>
          <Text style={styles.title}>"{itemQuery}"</Text>
        </View>

        {/* Results Cards */}
        <View style={styles.cards}>
          {mockResults.map((result, i) => (
            <View key={`${result.item}-${i}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{result.item}</Text>
                <DisposalBadge category={result.type} size="large" />
              </View>

              {/* Steps */}
              <View style={styles.steps}>
                {result.steps.map((step, j) => (
                  <View key={`${i}-step-${j}`} style={styles.stepRow}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{j + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* Why toggle */}
              <TouchableOpacity onPress={() => toggleWhy(i)} style={styles.whyBtn} activeOpacity={0.7}>
                <Text style={styles.whyText}>
                  Why? {expandedIdx === i ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {/* Why content */}
              {expandedIdx === i && (
                <View style={styles.whyBox}>
                  <Text style={styles.reasonText}>{result.reason}</Text>

                  <TouchableOpacity onPress={() => openSource(result.source)} activeOpacity={0.7}>
                    <Text style={styles.sourceLink}>View source ↗</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Drop-off CTA */}
              {result.needsDropoff && (
                <View style={styles.dropoffCta}>
                  <Button
                    title="Find Drop-Off Location"
                    onPress={() => router.push("/(tabs)/dropoff")}
                    variant="outline"
                    size="large"
                    icon="📍"
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Eco Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💚 Eco Tips</Text>
          <Text style={styles.tipLine}>• Consider reusable alternatives to reduce waste</Text>
          <Text style={styles.tipLine}>• Clean recyclables to prevent contamination</Text>
          <Text style={styles.tipLine}>• Check with your building for specific guidelines</Text>
        </View>

        {/* New Search */}
        <Button
          title="Search Another Item"
          onPress={() => router.replace("/(tabs)/home")}
          variant="outline"
          size="large"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg },

  header: { gap: 4 },
  backBtn: { marginBottom: SPACING.sm },
  backText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },

  cards: { gap: SPACING.md },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: SPACING.md },
  cardTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },

  steps: { gap: SPACING.sm },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceDark,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  stepNumText: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  stepText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text, lineHeight: 20 },

  whyBtn: { alignSelf: "flex-start" },
  whyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },

  whyBox: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  reasonText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, lineHeight: 20 },
  sourceLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  dropoffCta: { marginTop: SPACING.sm },

  tipsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  tipsTitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  tipLine: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, lineHeight: 20 },
});
