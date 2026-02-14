import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { Button } from "@/components/buttons";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/constants/theme";

type Slide = {
  emoji: string;
  title: string;
  description: string;
  bg: string;
};

export default function PermissionsScreen() {
  const slides = useMemo<Slide[]>(
    () => [
      {
        emoji: "📸",
        title: "Snap or Type",
        description:
          "Take a photo of your waste or type what you need to dispose of. Our AI identifies it instantly.",
        bg: COLORS.accentLight,
      },
      {
        emoji: "📍",
        title: "Local Rules, Automatically",
        description:
          "We check your local regulations so you always know the right bin, drop-off, or method.",
        bg: COLORS.surfaceDark,
      },
      {
        emoji: "📅",
        title: "Schedule Drop-Offs",
        description:
          "For items that need special handling, we'll find the nearest facility and help you schedule.",
        bg: COLORS.warning + "22",
      },
    ],
    []
  );

  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < slides.length - 1) {
      setCurrent((p) => p + 1);
      return;
    }
    router.replace("/(tabs)/home");
  };

  const skip = () => router.replace("/(tabs)/home");

  const slide = slides[current];

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip */}
      <View style={styles.topRow}>
        <Pressable onPress={skip} hitSlop={10}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      {/* Slide */}
      <View style={styles.center}>
        <View style={[styles.iconBox, { backgroundColor: slide.bg }]}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      {/* Dots + Button */}
      <View style={styles.bottom}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => {
            const active = i === current;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  active ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        <Button
          title={current === slides.length - 1 ? "Let's Go!" : "Next"}
          onPress={next}
          size="large"
          icon="→"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },

  topRow: { alignItems: "flex-end" },
  skip: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: SPACING.lg },
  iconBox: {
    width: 112,
    height: 112,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emoji: { fontSize: 48 },

  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: "center",
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },

  bottom: { gap: SPACING.lg },

  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { height: 8, borderRadius: 999 },
  dotActive: { width: 32, backgroundColor: COLORS.primary },
  dotInactive: { width: 8, backgroundColor: COLORS.border },
});
