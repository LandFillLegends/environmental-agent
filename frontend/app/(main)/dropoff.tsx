import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Button } from "@/components/buttons"; // or default import if that's how yours is exported
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
} from "@/constants/theme";
import { DISPOSAL_CATEGORIES } from '@/constants/disposal';

type Facility = {
  id: number;
  name: string;
  address: string;
  distance: string;
  hours: string;
  accepts: string[];
  isOpen: boolean;
};

// Mock facility data
const MOCK_FACILITIES: Facility[] = [
  {
    id: 1,
    name: "North Seattle Recycling Center",
    address: "1350 N 34th St, Seattle, WA 98103",
    distance: "1.2 miles",
    hours: "Mon-Sat: 8am-6pm, Sun: 10am-4pm",
    accepts: ["Batteries", "Electronics", "Hazardous Waste"],
    isOpen: true,
  },
  {
    id: 2,
    name: "Ballard Transfer Station",
    address: "1400 W Commodore Way, Seattle, WA 98119",
    distance: "2.8 miles",
    hours: "Mon-Sun: 8:30am-5:30pm",
    accepts: ["Batteries", "Electronics", "Metals", "Paint"],
    isOpen: true,
  },
  {
    id: 3,
    name: "South Park Recycling Center",
    address: "8100 2nd Ave S, Seattle, WA 98108",
    distance: "5.4 miles",
    hours: "Tue-Sat: 9am-5pm",
    accepts: ["Batteries", "Appliances", "Scrap Metal"],
    isOpen: false,
  },
];

type FilterChipProps = { label: string; active?: boolean };

function FilterChip({ label, active }: FilterChipProps) {
  return (
    <View style={[styles.filterChip, active && styles.filterChipActive]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </View>
  );
}

type DetailRowProps = { icon: string; text: string };

function DetailRow({ icon, text }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

type FacilityCardProps = {
  facility: Facility;
  isSelected: boolean;
  onSelect: () => void;
};

function FacilityCard({ facility, isSelected, onSelect }: FacilityCardProps) {
  return (
    <TouchableOpacity
      style={[styles.facilityCard, isSelected && styles.facilityCardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.facilityHeader}>
        <View style={styles.facilityTitleRow}>
          <Text style={styles.facilityName}>{facility.name}</Text>

          {facility.isOpen ? (
            <View style={styles.openBadge}>
              <View style={styles.openDot} />
              <Text style={styles.openText}>Open</Text>
            </View>
          ) : (
            <View style={styles.closedBadge}>
              <Text style={styles.closedText}>Closed</Text>
            </View>
          )}
        </View>

        <Text style={styles.facilityDistance}>📍 {facility.distance}</Text>
      </View>

      <View style={styles.facilityDetails}>
        <DetailRow icon="📍" text={facility.address} />
        <DetailRow icon="🕐" text={facility.hours} />
      </View>

      <View style={styles.acceptsSection}>
        <Text style={styles.acceptsTitle}>Accepts:</Text>
        <View style={styles.acceptsTags}>
          {facility.accepts.map((item) => (
            <View key={item} style={styles.acceptsTag}>
              <Text style={styles.acceptsTagText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.facilityActions}>
        <TouchableOpacity style={styles.facilityActionButton}>
          <Text style={styles.facilityActionText}>🗺️ Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.facilityActionButton}>
          <Text style={styles.facilityActionText}>📞 Call</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function Dropoff() {
  const router = useRouter();
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  const facilities = useMemo(() => MOCK_FACILITIES, []);

  const handleSchedule = () => {
    if (!selectedFacility) return;

    // Expo Router params are strings — serialize the object
    router.push({
      pathname: "/(tabs)/schedule",
      params: { facility: JSON.stringify(selectedFacility) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Find Drop-off Locations</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <Text style={styles.mapPlaceholder}>🗺️</Text>
          <Text style={styles.mapText}>Interactive Map View</Text>
          <Text style={styles.mapSubtext}>Showing facilities near you</Text>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          <FilterChip label="Nearest" active />
          <FilterChip label="Open Now" />
          <FilterChip label="Accepts Batteries" />
          <FilterChip label="Weekend Hours" />
        </ScrollView>

        {/* Facilities List */}
        <View style={styles.facilitiesSection}>
          <Text style={styles.sectionTitle}>{facilities.length} facilities found</Text>

          {facilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              isSelected={selectedFacility?.id === facility.id}
              onSelect={() => setSelectedFacility(facility)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      {selectedFacility ? (
        <View style={styles.bottomAction}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>{selectedFacility.name}</Text>
            <Text style={styles.selectedDistance}>
              {selectedFacility.distance} away
            </Text>
          </View>

          <Button title="Schedule Visit" onPress={handleSchedule} size="medium" icon="📅" />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { marginBottom: SPACING.sm },
  backText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  scrollView: { flex: 1 },
  content: { gap: SPACING.lg, paddingBottom: SPACING.xl },
  mapContainer: {
    height: 200,
    backgroundColor: COLORS.surfaceDark,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.sm,
  },
  mapPlaceholder: { fontSize: 64 },
  mapText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  mapSubtext: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  filtersContainer: { paddingHorizontal: SPACING.lg },
  filterChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
  },
  filterChipTextActive: { color: COLORS.surface },
  facilitiesSection: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  facilityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  facilityCardSelected: { borderColor: COLORS.primary, ...SHADOWS.md },
  facilityHeader: { gap: SPACING.xs },
  facilityTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  facilityName: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  openText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.success,
  },
  closedBadge: {
    backgroundColor: `${COLORS.textLight}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  closedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  facilityDistance: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  facilityDetails: { gap: SPACING.xs },
  detailRow: { flexDirection: "row", gap: SPACING.sm, alignItems: "flex-start" },
  detailIcon: { fontSize: 14 },
  detailText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, lineHeight: 20 },
  acceptsSection: { gap: SPACING.xs },
  acceptsTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.medium, color: COLORS.text },
  acceptsTags: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  acceptsTag: { backgroundColor: COLORS.accentLight, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.sm },
  acceptsTagText: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text, fontWeight: TYPOGRAPHY.fontWeight.medium },
  facilityActions: { flexDirection: "row", gap: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md },
  facilityActionButton: { flex: 1 },
  facilityActionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: "center",
  },
  bottomAction: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    ...SHADOWS.lg,
  },
  selectedInfo: { flex: 1 },
  selectedName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  selectedDistance: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
});
