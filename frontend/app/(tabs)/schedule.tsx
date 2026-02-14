import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";

// If your Button component lives somewhere else, update this import.
// Example alternatives:
// import { Button } from "@/components/ui/Button";
// import { Button } from "@/components/Button";
import { Button } from "@/components/buttons";

type WeatherType = "sunny" | "cloudy";

type TimeSlot = {
  day: string;
  time: string;
  weather: WeatherType;
  temp: string;
  label?: string | null;
};

const TIME_SLOTS: TimeSlot[] = [
  { day: "Thu, Feb 13", time: "4:00 PM", weather: "sunny", temp: "52°F", label: "Recommended" },
  { day: "Fri, Feb 14", time: "10:00 AM", weather: "cloudy", temp: "47°F", label: null },
  { day: "Sat, Feb 15", time: "2:00 PM", weather: "sunny", temp: "55°F", label: null },
];

type Facility = {
  name?: string;
  hours?: string;
};

// If you pass facility through params: router.push({ pathname: "/(tabs)/schedule", params: { facility: JSON.stringify(facilityObj) } })
export default function ScheduleScreen() {
  const params = useLocalSearchParams<{ facility?: string }>();
  const addScheduledDropoff = useAppStore((s) => s.addScheduledDropoff);

  const facility: Facility = useMemo(() => {
    if (!params.facility) return { name: "EcoStation North", hours: "Open Mon–Sat, 8:00 AM – 6:00 PM" };
    try {
      return JSON.parse(params.facility);
    } catch {
      return { name: "EcoStation North", hours: "Open Mon–Sat, 8:00 AM – 6:00 PM" };
    }
  }, [params.facility]);

  const [selected, setSelected] = useState(0);
  const [reminder, setReminder] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  const selectedSlot = TIME_SLOTS[selected];

  const handleConfirm = () => {
    // Save to store (mock “calendar add” for now)
    addScheduledDropoff?.({
      id: Date.now(),
      facility: facility.name ?? "EcoStation North",
      hours: facility.hours ?? "",
      date: selectedSlot.day,
      time: selectedSlot.time,
      reminder,
    });

    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successWrap}>
          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>

          <Text style={styles.successTitle}>All Set!</Text>
          <Text style={styles.successSubtitle}>
            Your drop-off is scheduled for {selectedSlot.day} at {selectedSlot.time}.
          </Text>

          {reminder ? (
            <Text style={styles.reminderPill}>🔔 Reminder set</Text>
          ) : null}

          <Button
            title="Back to Home"
            onPress={() => router.replace("/(tabs)/home")}
            size="large"
            icon="🏠"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <Text style={styles.title}>Schedule Drop-Off</Text>
          <Text style={styles.subtitle}>{facility.name ?? "EcoStation North"}</Text>
          <Text style={styles.hours}>{facility.hours ?? "Open Mon–Sat, 8:00 AM – 6:00 PM"}</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoText}>
            Pick a time that works for you. We'll add it to your calendar.
          </Text>
        </View>

        {/* Time Slots */}
        <View style={styles.slotsWrap}>
          {TIME_SLOTS.map((slot, i) => {
            const isSelected = selected === i;
            return (
              <Pressable
                key={`${slot.day}-${slot.time}`}
                onPress={() => setSelected(i)}
                style={[
                  styles.slotCard,
                  isSelected ? styles.slotSelected : styles.slotUnselected,
                ]}
              >
                <View style={{ gap: 4 }}>
                  <Text style={styles.slotDay}>{slot.day}</Text>
                  <Text style={styles.slotTime}>🕒 {slot.time}</Text>
                </View>

                <View style={styles.slotRight}>
                  <View style={styles.weatherWrap}>
                    <Text style={styles.weatherIcon}>{slot.weather === "sunny" ? "☀️" : "☁️"}</Text>
                    <Text style={styles.weatherTemp}>{slot.temp}</Text>
                  </View>

                  {slot.label ? (
                    <View style={styles.recommendedPill}>
                      <Text style={styles.recommendedText}>{slot.label}</Text>
                    </View>
                  ) : null}

                  {isSelected ? (
                    <View style={styles.selectedCheck}>
                      <Text style={styles.selectedCheckText}>✓</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Reminder */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderLeft}>
            <Text style={styles.reminderIcon}>🔔</Text>
            <Text style={styles.reminderLabel}>Set reminder</Text>
          </View>
          <Switch value={reminder} onValueChange={setReminder} />
        </View>

        {/* Confirm */}
        <Button title="Add to Calendar" onPress={handleConfirm} size="large" icon="✓" />

        {/* Before You Go */}
        <View style={styles.beforeCard}>
          <Text style={styles.beforeTitle}>📌 Before You Go</Text>
          <Text style={styles.beforeItem}>• Bring a valid ID if required</Text>
          <Text style={styles.beforeItem}>• Keep items separated if needed</Text>
          <Text style={styles.beforeItem}>• Check facility website for any updates</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

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
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  hours: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },

  infoCard: {
    backgroundColor: COLORS.accentLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  infoIcon: { fontSize: 18 },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    lineHeight: 20,
  },

  slotsWrap: { gap: SPACING.md },

  slotCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOWS.sm,
  },
  slotSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.accentLight,
  },
  slotUnselected: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  slotDay: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  slotTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  slotRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  weatherWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  weatherIcon: { fontSize: 16 },
  weatherTemp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  recommendedPill: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  recommendedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  selectedCheck: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCheckText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },

  reminderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOWS.sm,
  },
  reminderLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  reminderIcon: { fontSize: 18 },
  reminderLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },

  beforeCard: {
    backgroundColor: COLORS.accentLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  beforeTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  beforeItem: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    lineHeight: 20,
  },

  // Success
  successWrap: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  successCheck: {
    fontSize: 38,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  successSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  reminderPill: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
});
