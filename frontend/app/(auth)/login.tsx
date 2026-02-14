import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Button } from "@/components/buttons"; 
import { useAppStore } from "@/store/useAppStore";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
} from "@/constants/theme";

type PermissionKey = "location" | "camera" | "calendar";
type PermissionStatus = "granted" | "denied" | "undetermined";

type PermissionCardProps = {
  icon: string;
  title: string;
  description: string;
  required?: boolean;
};

export default function Permissions() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  const setPermission = useAppStore((state) => state.setPermission);

  const handleContinue = async () => {
    setLoading(true);

    // Simulate permission requests
    setTimeout(() => {
      setPermission("location" as PermissionKey, "granted" as PermissionStatus);
      setPermission("camera" as PermissionKey, "granted" as PermissionStatus);
      setPermission("calendar" as PermissionKey, "granted" as PermissionStatus);

      setLoading(false);

      // Go to main app
      router.replace("/(tabs)/home"); // if you're using tabs for home
      // or: router.replace("/(main)/home");
    }, 1000);
  };

  const handleSkip = () => {
    Alert.alert(
      "Limited Features",
      "Some features may not work without permissions. You can enable them later in settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue Anyway",
          onPress: () => router.replace("/(tabs)/home"),
          // or: router.replace("/(main)/home")
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>🔑</Text>
          <Text style={styles.title}>Let&apos;s Get You Set Up</Text>
          <Text style={styles.subtitle}>
            We need a few permissions to provide the best disposal guidance
          </Text>
        </View>

        {/* Permission Cards */}
        <View style={styles.permissions}>
          <PermissionCard
            icon="📍"
            title="Location Access"
            description="Required to provide accurate local disposal regulations and find nearby drop-off facilities"
            required
          />
          <PermissionCard
            icon="📸"
            title="Camera Access"
            description="Take photos of items for instant AI-powered identification"
          />
          <PermissionCard
            icon="📅"
            title="Calendar Access"
            description="Schedule and manage drop-off appointments directly in your calendar"
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Enable Permissions"
            onPress={handleContinue}
            loading={loading}
            size="large"
            icon="✓"
          />
          <Button
            title="Skip for Now"
            onPress={handleSkip}
            variant="ghost"
            size="medium"
          />
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 You can change these permissions anytime in your device settings
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PermissionCard({ icon, title, description, required }: PermissionCardProps) {
  return (
    <View style={styles.permissionCard}>
      <View style={styles.permissionHeader}>
        <Text style={styles.permissionIcon}>{icon}</Text>

        <View style={styles.permissionInfo}>
          <View style={styles.permissionTitleRow}>
            <Text style={styles.permissionTitle}>{title}</Text>
            {required ? (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.permissionDescription}>{description}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    gap: SPACING.xl,
  },
  header: {
    alignItems: "center",
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  permissions: {
    gap: SPACING.md,
  },
  permissionCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  permissionHeader: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  permissionIcon: {
    fontSize: 32,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  permissionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  requiredBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  requiredText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.surface,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  permissionDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actions: {
    gap: SPACING.md,
  },
  infoBox: {
    backgroundColor: COLORS.accentLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 20,
  },
});
