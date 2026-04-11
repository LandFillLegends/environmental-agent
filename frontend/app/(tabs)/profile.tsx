import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Location from "expo-location";

import { supabase } from "@/lib/supabase";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/constants/theme";

type HistoryItem = {
  item: string;
  type: "recycle" | "hazardous" | "compost" | "dropoff" | "trash";
  date: string;
};

const BADGE_COLORS: Record<HistoryItem["type"], { bg: string; text: string; label: string }> = {
  recycle:   { bg: COLORS.recycle + "20",   text: COLORS.recycle,   label: "Recycle" },
  hazardous: { bg: COLORS.hazardous + "20", text: COLORS.hazardous, label: "Hazardous" },
  compost:   { bg: COLORS.compost + "20",   text: COLORS.compost,   label: "Compost" },
  dropoff:   { bg: COLORS.primary + "20",   text: COLORS.primary,   label: "Drop-Off" },
  trash:     { bg: COLORS.trash + "20",     text: COLORS.trash,     label: "Trash" },
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

function DisposalBadge({ category }: { category: HistoryItem["type"] }) {
  const config = BADGE_COLORS[category];
  return (
    <View style={[badgeStyles.badge, { backgroundColor: config.bg }]}>
      <Text style={[badgeStyles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  text: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

function CollapsibleMenuItem({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(anim, {
      toValue: open ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setOpen((v) => !v);
  };

  return (
    <View>
      <Pressable onPress={toggle} style={menuStyles.row}>
        <View style={menuStyles.left}>
          <Text style={menuStyles.icon}>{icon}</Text>
          <Text style={menuStyles.label}>{label}</Text>
        </View>
        <Text style={menuStyles.chevron}>{open ? "▾" : "›"}</Text>
      </Pressable>
      {open && <View>{children}</View>}
    </View>
  );
}

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  left: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  icon: { fontSize: 16 },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  chevron: { fontSize: 18, color: COLORS.textSecondary },
});

export default function ProfileScreen() {
  const [username, setUsername] = useState<string | null>(null);
  const [joinDate, setJoinDate] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);

  useEffect(() => {
    // Pull name and join date from Supabase
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) {
        setUsername(user.user_metadata.full_name);
      } else if (user?.email) {
        setUsername(user.email.split("@")[0]);
      }

      if (user?.created_at) {
        const d = new Date(user.created_at);
        setJoinDate(
          d.toLocaleString("default", { month: "short" }) + " " + d.getFullYear()
        );
      }
    });

    // Get device location and reverse-geocode to city + region
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const { coords } = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync(coords);
      if (place) {
        const city = place.city ?? place.subregion ?? "";
        const region = place.region ?? "";
        setUserLocation([city, region].filter(Boolean).join(", "));
      }
    })();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/welcome");
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
              {(username?.[0] ?? "M").toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name}>{username ?? "Maya Johnson"}</Text>
            <Text style={styles.meta}>
              {userLocation ?? "Location unavailable"}
              {joinDate ? ` • Joined ${joinDate}` : ""}
            </Text>
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
                  style={[styles.innerRow, i !== 0 && styles.innerRowDivider]}
                >
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyItem}>{h.item}</Text>
                    <DisposalBadge category={h.type} />
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
                  style={[styles.innerRow, i !== 0 && styles.innerRowDivider]}
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
