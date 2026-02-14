import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/constants/theme";

type Facility = {
  name: string;
  address: string;
  hours: string;
  distance: string;
  accepts: string[];
};

const FACILITIES: Facility[] = [
  {
    name: "EcoStation North",
    address: "1234 Green Way, Seattle, WA",
    hours: "Mon–Sat 9am–6pm",
    distance: "1.2 mi",
    accepts: ["Batteries", "Electronics", "Paint", "Fluorescent Bulbs"],
  },
  {
    name: "City Recycling Center",
    address: "5678 Earth Blvd, Seattle, WA",
    hours: "Tue–Sun 8am–5pm",
    distance: "3.4 mi",
    accepts: ["Batteries", "Tires", "Motor Oil", "Appliances"],
  },
];

export default function DropoffScreen() {
  const facilities = useMemo(() => FACILITIES, []);

  const onSelectFacility = (facility: Facility) => {
    router.push({
      pathname: "/(tabs)/schedule",
      params: { facility: JSON.stringify(facility) },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <Text style={styles.title}>Drop-Off Locations</Text>
          <Text style={styles.subtitle}>Nearest facilities for your items</Text>
        </View>

        {/* List */}
        <View style={styles.list}>
          {facilities.map((f) => (
            <FacilityCard key={f.name} facility={f} onPress={() => onSelectFacility(f)} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FacilityCard({ facility, onPress }: { facility: Facility; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{facility.name}</Text>
          <Text style={styles.cardAddress}>📍 {facility.address}</Text>
          <Text style={styles.cardHours}>🕒 {facility.hours}</Text>
        </View>

        <View style={styles.distancePill}>
          <Text style={styles.distanceText}>{facility.distance}</Text>
        </View>
      </View>

      <View style={styles.acceptsWrap}>
        <Text style={styles.acceptsLabel}>Accepts:</Text>
        <View style={styles.tagsRow}>
          {facility.accepts.slice(0, 4).map((item) => (
            <View key={item} style={styles.tag}>
              <Text style={styles.tagText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerHint}>Tap to schedule →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },

  header: { gap: 6 },
  backBtn: { alignSelf: "flex-start" },
  backText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },

  list: { gap: SPACING.md },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  pressed: { opacity: 0.88 },

  cardTop: { flexDirection: "row", gap: SPACING.md, alignItems: "flex-start" },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  cardAddress: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, marginBottom: 2 },
  cardHours: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },

  distancePill: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  distanceText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },

  acceptsWrap: { gap: SPACING.xs },
  acceptsLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  tag: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  footerHint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});
