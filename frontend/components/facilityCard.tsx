import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "@/components/buttons";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/constants/theme";

interface FacilityCardProps {
  name: string;
  address: string;
  hours: string;
  distance: string;
  accepts: string[];
  onNavigate?: () => void;
}

export const FacilityCard = ({
  name,
  address,
  hours,
  distance,
  accepts,
  onNavigate,
}: FacilityCardProps) => {
  return (
    <View style={styles.card}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.address}>📍 {address}</Text>
        </View>

        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{distance}</Text>
        </View>
      </View>

      {/* Hours */}
      <Text style={styles.hours}>🕐 {hours}</Text>

      {/* Accepted Items */}
      <View style={styles.acceptsContainer}>
        {accepts.map((item) => (
          <View key={item} style={styles.acceptBadge}>
            <Text style={styles.acceptText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️ Map Preview</Text>
      </View>

      {/* Button */}
      <Button
        title="Get Directions"
        onPress={onNavigate}
        icon="📍"
        size="medium"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  address: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  distanceBadge: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    alignSelf: "flex-start",
  },
  distanceText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  hours: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  acceptsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  acceptBadge: {
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
  },
  acceptText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text,
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
  mapText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});
