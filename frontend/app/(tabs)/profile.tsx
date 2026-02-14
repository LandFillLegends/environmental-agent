import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import CollapsibleMenuItem from "@/components/collapsibleMenuItem";
import { DisposalBadge } from "@/components/disposalBadge";
import { useAppStore } from "@/store/useAppStore";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/constants/theme";

type HistoryItem = {
  item: string;
  type: "recycle" | "hazardous" | "compost" | "dropoff" | "trash";
  date: string;
};

const stats = [
  { label: "Items Disposed", value: "47", icon: "♻️" },
  { label: "Eco Score", value: "82", icon: "🌿" },
  { label: "This Week", value: "+5", icon: "📈" },
];

const history: HistoryItem[] = [
  { item: "Pizza Box", type: "recycle", date: "Today" },
  { item: "AA Batteries", type: "hazardous", date: "Yesterday" },
  { item: "Banana Peel", type: "compost", date: "Feb 10" },
  { item: "Styrofoam", type: "dropoff", date: "Feb 8" },
  { item: "Plastic Bag", type: "trash", date: "Feb 7" },
];

const savedLocations = [
  { name: "EcoStation North", address: "1234 Green Ave, Seattle" },
  { name: "Hazardous Waste Depot", address: "890 Industrial Blvd, Seattle" },
  { name: "Community Recycling Hub", address: "456 Oak St, Bellevue" },
];

const calendarEvent = [
  { label: "Event", value: "Drop-off at Recycling Center" },
  { label: "Location", value: "Facility" },
  { label: "Date & Time", value: "Friday, Feb 16, 2:00 PM - 3:00 PM" },
  { label: "Travel Time", value: "~8 minutes" },
];

export default function ProfileScreen() {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          logout?.();
          // back to auth welcome
          router.replace("/(auth)");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name?.[0] ?? "M").toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name}>{user?.name ?? "Maya Johnson"}</Text>
            <Text style={styles.meta}>Seattle, WA • Joined Jan 2025</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Collapsible menus */}
        <View style={styles.menuCard}>
          <View style={styles.dividerTop} />

          <CollapsibleMenuItem icon="📜" label="Disposal History">
            <View style={styles.innerSection}>
              {history.map((h, i) => (
                <View
                  key={`${h.item}-${i}`}
                  style={[
                    styles.innerRow,
                    i !== 0 && styles.innerRowDivider,
                  ]}
                >
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyItem}>{h.item}</Text>
                    <DisposalBadge category={h.type} size="small" />
                  </View>
                  <Text style={styles.historyDate}>{h.date}</Text>
                </View>
              ))}
            </View>
          </CollapsibleMenuItem>

          <View style={styles.divider} />

          <CollapsibleMenuItem icon="📍" label="Saved Locations">
            <View style={styles.innerSection}>
              {savedLocations.map((loc, i) => (
                <View
                  key={`${loc.name}-${i}`}
                  style={[
                    styles.innerRow,
                    i !== 0 && styles.innerRowDivider,
                  ]}
                >
                  <Text style={styles.locationPin}>📌</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationName}>{loc.name}</Text>
                    <Text style={styles.locationAddress}>{loc.address}</Text>
                  </View>
                </View>
              ))}
            </View>
          </CollapsibleMenuItem>

          <View style={styles.divider} />

          <CollapsibleMenuItem icon="🔔" label="Notifications">
            <View style={styles.innerSection}>
              <Text style={styles.previewTitle}>📅 Calendar Event Preview</Text>

              {calendarEvent.map((row) => (
                <View key={row.label} style={styles.previewRow}>
                  <Text style={styles.previewLabel}>{row.label}</Text>
                  <Text style={styles.previewValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </CollapsibleMenuItem>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <ActionRow
            icon="⚙️"
            label="Settings"
            onPress={() => Alert.alert("Coming Soon", "Settings coming soon!")}
          />
          <ActionRow icon="🚪" label="Sign Out" onPress={handleSignOut} danger />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.actionRow, danger && styles.actionRowDanger]}
    >
      <View style={styles.actionLeft}>
        <Text style={styles.actionIcon}>{icon}</Text>
        <Text style={[styles.actionLabel, danger && styles.actionLabelDanger]}>
          {label}
        </Text>
      </View>
      <Text style={styles.actionChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 22,
    color: COLORS.surface,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  headerText: { flex: 1 },
  name: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  meta: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },

  statsRow: { flexDirection: "row", gap: SPACING.md },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  dividerTop: { height: 0 },
  divider: { height: 1, backgroundColor: COLORS.border },

  innerSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingBottom: SPACING.sm,
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    gap: SPACING.md,
  },
  innerRowDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },

  historyLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  historyItem: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  historyDate: { fontSize: 12, color: COLORS.textSecondary },

  locationPin: { fontSize: 14 },
  locationName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  locationAddress: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  previewTitle: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  previewLabel: { fontSize: 12, color: COLORS.textSecondary },
  previewValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },

  actions: { gap: SPACING.sm },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  actionRowDanger: {
    borderColor: COLORS.error + "40",
    backgroundColor: COLORS.error + "08",
  },
  actionLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  actionIcon: { fontSize: 16 },
  actionLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  actionLabelDanger: { color: COLORS.error },
  actionChevron: { fontSize: 22, color: COLORS.textSecondary },
});
