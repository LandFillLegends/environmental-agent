import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "@/components/buttons";
import { useAppStore } from "@/store/useAppStore";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
} from "@/constants/theme";
import { DISPOSAL_CATEGORIES } from '@/constants/disposal';

type TimeSlot = {
  id: number;
  date: string;
  time: string;
  weather: string;
  recommended?: boolean;
  reason?: string;
};

type Facility = {
  id?: number;
  name?: string;
  address?: string;
  hours?: string;
  distance?: string;
};

const MOCK_TIME_SLOTS: TimeSlot[] = [
  {
    id: 1,
    date: "Thursday, Feb 15",
    time: "4:00 PM - 5:00 PM",
    weather: "☀️ 62°F",
    recommended: true,
    reason: "Best time based on your calendar",
  },
  {
    id: 2,
    date: "Friday, Feb 16",
    time: "2:00 PM - 3:00 PM",
    weather: "⛅ 58°F",
  },
  {
    id: 3,
    date: "Saturday, Feb 17",
    time: "10:00 AM - 11:00 AM",
    weather: "🌤️ 60°F",
  },
];

type TimeSlotCardProps = {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: () => void;
};

function TimeSlotCard({ slot, isSelected, onSelect }: TimeSlotCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.timeSlot,
        isSelected && styles.timeSlotSelected,
        slot.recommended && styles.timeSlotRecommended,
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      {slot.recommended ? (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>✨ Recommended</Text>
        </View>
      ) : null}

      <View style={styles.timeSlotContent}>
        <View style={styles.timeSlotMain}>
          <Text style={styles.timeSlotDate}>{slot.date}</Text>
          <Text style={styles.timeSlotTime}>{slot.time}</Text>
          {slot.reason ? (
            <Text style={styles.timeSlotReason}>{slot.reason}</Text>
          ) : null}
        </View>

        <View style={styles.timeSlotWeather}>
          <Text style={styles.weatherText}>{slot.weather}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

type PreviewRowProps = { label: string; value: string };
function PreviewRow({ label, value }: PreviewRowProps) {
  return (
    <View style={styles.previewRow}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value}</Text>
    </View>
  );
}

type TipProps = { text: string };
function Tip({ text }: TipProps) {
  return (
    <View style={styles.tip}>
      <Text style={styles.tipBullet}>•</Text>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

export default function Schedule() {
  const router = useRouter();

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>(MOCK_TIME_SLOTS[0]);
  const [addReminder, setAddReminder] = useState<boolean>(true);

  const addScheduledDropoff = useAppStore((s) => s.addScheduledDropoff);

  // ✅ Read param from URL (sent from Dropoff as JSON string)
  const { facility: facilityParam } = useLocalSearchParams<{ facility?: string }>();

  const facility = useMemo<Facility>(() => {
    if (!facilityParam) return {};
    try {
      return JSON.parse(facilityParam) as Facility;
    } catch {
      return {};
    }
  }, [facilityParam]);

  const handleConfirm = () => {
    const dropoff = {
      id: Date.now(),
      facility: facility.name ?? "Drop-off Facility",
      address: facility.address ?? "",
      date: selectedSlot.date,
      time: selectedSlot.time,
      reminder: addReminder,
    };

    addScheduledDropoff(dropoff);

    Alert.alert(
      "✅ Event Created",
      `Drop-off scheduled for ${selectedSlot.date} at ${selectedSlot.time}`,
      [
        {
          text: "Done",
          onPress: () => router.replace("/(tabs)/home"),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Schedule Drop-off</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Facility Summary */}
        <View style={styles.facilityCard}>
          <Text style={styles.facilityIcon}>📍</Text>
          <View style={styles.facilityInfo}>
            <Text style={styles.facilityName}>
              {facility.name ?? "Selected Facility"}
            </Text>
            <Text style={styles.facilityAddress}>{facility.address ?? ""}</Text>
            <Text style={styles.facilityHours}>🕐 {facility.hours ?? "Hours unavailable"}</Text>
          </View>
        </View>

        {/* Time Slots */}
        <View style={styles.slotsSection}>
          <Text style={styles.sectionTitle}>Choose a Time Slot</Text>

          {MOCK_TIME_SLOTS.map((slot) => (
            <TimeSlotCard
              key={slot.id}
              slot={slot}
              isSelected={selectedSlot.id === slot.id}
              onSelect={() => setSelectedSlot(slot)}
            />
          ))}
        </View>

        {/* Calendar Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>📅 Calendar Event Preview</Text>
          <View style={styles.previewContent}>
            <PreviewRow label="Event" value="Drop-off at Recycling Center" />
            <PreviewRow label="Location" value={facility.name ?? "Facility"} />
            <PreviewRow
              label="Date & Time"
              value={`${selectedSlot.date}, ${selectedSlot.time}`}
            />
            <PreviewRow label="Travel Time" value="~8 minutes" />
          </View>
        </View>

        {/* Reminder Option */}
        <TouchableOpacity
          style={styles.reminderOption}
          onPress={() => setAddReminder((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.reminderCheckbox}>
            {addReminder ? <Text style={styles.reminderCheck}>✓</Text> : null}
          </View>
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderTitle}>Add Reminder</Text>
            <Text style={styles.reminderDescription}>
              Get notified 1 hour before your drop-off time
            </Text>
          </View>
        </TouchableOpacity>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Before You Go</Text>
          <Tip text="Bring a valid ID if required" />
          <Tip text="Keep items separated if needed" />
          <Tip text="Check facility website for any updates" />
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Button title="Add to Calendar" onPress={handleConfirm} size="large" icon="✓" />
      </View>
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
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: 100 },

  facilityCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  facilityIcon: { fontSize: 32 },
  facilityInfo: { flex: 1, gap: SPACING.xs },
  facilityName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  facilityAddress: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  facilityHours: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },

  slotsSection: { gap: SPACING.md },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },

  timeSlot: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  timeSlotSelected: { borderColor: COLORS.primary, ...SHADOWS.md },
  timeSlotRecommended: { borderColor: COLORS.accent },

  recommendedBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: "flex-start",
    marginBottom: SPACING.sm,
  },
  recommendedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },

  timeSlotContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timeSlotMain: { flex: 1 },

  timeSlotDate: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  timeSlotTime: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  timeSlotReason: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  timeSlotWeather: { alignItems: "flex-end" },
  weatherText: { fontSize: TYPOGRAPHY.fontSize.md },

  previewCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  previewTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  previewContent: { gap: SPACING.sm },

  previewRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: SPACING.xs },
  previewLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  previewValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    textAlign: "right",
    flex: 1,
    marginLeft: SPACING.md,
  },

  reminderOption: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  reminderCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  reminderCheck: { fontSize: 14, color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.bold },
  reminderInfo: { flex: 1 },
  reminderTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  reminderDescription: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },

  tipsCard: {
    backgroundColor: COLORS.accentLight,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  tipsTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  tip: { flexDirection: "row", gap: SPACING.sm },
  tipBullet: { fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.text },
  tipText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text, lineHeight: 20 },

  bottomAction: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.lg,
  },
});
