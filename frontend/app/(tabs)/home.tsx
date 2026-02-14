import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";

type InputType = "text" | "image";

const RECENT_ITEMS = [
  { name: "Pizza Box", emoji: "🍕" },
  { name: "Plastic Bottle", emoji: "🧴" },
  { name: "Battery", emoji: "🔋" },
  { name: "Styrofoam", emoji: "📦" },
] as const;

export default function HomeScreen() {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();

  const setCurrentItem = useAppStore((s) => s.setCurrentItem);

  const canSubmit = trimmed.length > 0;

  const handleSubmit = (q: string, type: InputType) => {
    const clean = q.trim();
    if (!clean && type === "text") return;

    Keyboard.dismiss();

    // Store it globally (recommended for your flow: Home -> Processing -> Results)
    // If your store signature differs, tell me and I’ll adjust.
    setCurrentItem(clean || "Photo item", type === "image" ? { uri: "mock://camera" } : null);

    // Navigate to processing route (Expo Router)
    router.push("/(main)/processing");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Hello there 👋</Text>
            <Text style={styles.title}>What&apos;s in your hand?</Text>
          </View>

          <View style={styles.leafBadge}>
            <Text style={styles.leafIcon}>🍃</Text>
          </View>
        </View>

        {/* Input Card */}
        <View style={styles.inputCard}>
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔎</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Type an item to dispose..."
              placeholderTextColor={COLORS.textLight}
              style={styles.input}
              returnKeyType="search"
              onSubmitEditing={() => handleSubmit(trimmed, "text")}
            />
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => handleSubmit(trimmed, "text")}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.identifyBtn,
                !canSubmit && styles.identifyBtnDisabled,
                pressed && canSubmit && styles.pressed,
              ]}
            >
              <Text style={styles.identifyBtnText}>✨ Identify</Text>
            </Pressable>

            <Pressable
              onPress={() => handleSubmit("Photo item", "image")}
              style={({ pressed }) => [styles.cameraBtn, pressed && styles.pressed]}
            >
              <Text style={styles.cameraBtnText}>📷</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Items */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COMMON ITEMS</Text>

          <View style={styles.grid}>
            {RECENT_ITEMS.map((item) => (
              <Pressable
                key={item.name}
                onPress={() => handleSubmit(item.name, "text")}
                style={({ pressed }) => [
                  styles.commonItem,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.commonEmoji}>{item.emoji}</Text>
                <Text style={styles.commonText}>{item.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Eco Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Text style={styles.tipIcon}>🍃</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Eco Tip of the Day</Text>
            <Text style={styles.tipText}>
              Rinse containers before recycling — food residue can contaminate an entire batch!
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hello: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  title: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  leafBadge: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  leafIcon: {
    fontSize: 18,
    color: COLORS.surface,
  },

  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    height: 48,
    gap: SPACING.sm,
  },
  searchIcon: { fontSize: 16 },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
  },

  actionsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  identifyBtn: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  identifyBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  identifyBtnText: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  cameraBtn: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBtnText: { fontSize: 18 },

  section: { gap: SPACING.sm },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  commonItem: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  commonEmoji: { fontSize: 22 },
  commonText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },

  tipCard: {
    backgroundColor: COLORS.accentLight,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    flexDirection: "row",
    gap: SPACING.md,
    alignItems: "flex-start",
  },
  tipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  tipIcon: { fontSize: 14, color: COLORS.surface },
  tipTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  tipText: {
    marginTop: 4,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  pressed: { opacity: 0.85 },
});
