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
import { useRouter } from "expo-router";

import { useAppStore } from "@/store/useAppStore";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/constants/theme";
import { DISPOSAL_CATEGORIES } from '@/constants/disposal';

type StatCardProps = {
  icon: string;
  value: string;
  label: string;
};

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type MenuItemProps = {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

function MenuItem({ icon, title, subtitle, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuInfo}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();

  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const disposalHistory = useAppStore((s) => s.disposalHistory);
  const scheduledDropoffs = useAppStore((s) => s.scheduledDropoffs);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>

          <Text style={styles.userName}>{user?.name || "User"}</Text>
          <Text style={styles.userEmail}>
            {user?.email || "guest@landfilllegends.com"}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <StatCard icon="♻️" value="42" label="Items Disposed" />
          <StatCard icon="🌱" value="8.2kg" label="CO₂ Saved" />
          <StatCard icon="📅" value={String(scheduledDropoffs.length)} label="Upcoming" />
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="📜"
            title="Disposal History"
            subtitle={`${disposalHistory.length} items`}
            onPress={() => Alert.alert("Coming Soon", "History view coming soon!")}
          />
          <MenuItem
            icon="📍"
            title="Saved Locations"
            subtitle="Manage favorite facilities"
            onPress={() => Alert.alert("Coming Soon", "Saved locations coming soon!")}
          />
          <MenuItem
            icon="🔔"
            title="Notifications"
            subtitle="Manage reminders"
            onPress={() => Alert.alert("Coming Soon", "Notification settings coming soon!")}
          />
          <MenuItem
            icon="⚙️"
            title="Settings"
            subtitle="App preferences"
            onPress={() => Alert.alert("Coming Soon", "Settings coming soon!")}
          />
          <MenuItem
            icon="ℹ️"
            title="About"
            subtitle="Learn more about Landfill Legends"
            onPress={() =>
              Alert.alert(
                "About",
                "Landfill Legends v1.0.0\n\nYour AI-powered disposal assistant"
              )
            }
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>🚪 Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg },
  header: { alignItems: "center", paddingVertical: SPACING.lg },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 36,
    color: COLORS.surface,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  userEmail: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  statsSection: { flexDirection: "row", gap: SPACING.md },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    ...SHADOWS.sm,
  },
  statIcon: { fontSize: 28, marginBottom: SPACING.xs },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, textAlign: "center" },
  menuSection: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: { fontSize: 24 },
  menuInfo: { flex: 1 },
  menuTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    marginBottom: 2,
  },
  menuSubtitle: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  menuArrow: { fontSize: 24, color: COLORS.textLight },
  logoutButton: {
    backgroundColor: `${COLORS.error}10`,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${COLORS.error}30`,
  },
  logoutText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.error,
  },
});