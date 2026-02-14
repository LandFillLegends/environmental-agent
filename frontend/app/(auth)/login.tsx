import React, { useState } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/constants/theme";
import { Button } from "@/components/buttons";
import { useAppStore } from "@/store/useAppStore";

// If you have your logo in /assets, update the path to match your project.
const landfillLogo = require("@/assets/landfill-logo.png");

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const setUser = useAppStore((s) => s.setUser);

  const handleGoogleLogin = async () => {
    setLoading(true);

    // Placeholder — swap with expo-auth-session later
    setTimeout(() => {
      setUser?.({
        id: "user_123",
        email: "maya.student@example.com",
        name: "Maya",
        picture: null,
      });

      setLoading(false);
      router.replace("/(tabs)/home");
    }, 900);
  };

  const handleGuest = () => {
    setUser?.({ id: "guest", name: "Guest", isGuest: true });
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrap}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image source={landfillLogo} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Bottom section */}
        <View style={styles.bottom}>
          <View style={styles.textBlock}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to get personalized disposal guidance</Text>
          </View>

          <Button
            title="Continue with Google"
            onPress={handleGoogleLogin}
            variant="outline"
            size="large"
            loading={loading}
            icon="G"
          />

          <View style={styles.privacyRow}>
            <Text style={styles.privacyIcon}>🛡️</Text>
            <Text style={styles.privacyText}>Your data is private and secure</Text>
          </View>

          <Pressable onPress={handleGuest} style={styles.guestBtn}>
            <Text style={styles.guestText}>Continue as guest</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  wrap: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    justifyContent: "space-between",
  },

  logoSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: 220,
  },

  bottom: {
    gap: SPACING.lg,
    paddingBottom: SPACING.md,
  },

  textBlock: { alignItems: "center", gap: SPACING.xs },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  privacyIcon: { fontSize: 12 },
  privacyText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  guestBtn: { alignItems: "center", paddingVertical: SPACING.sm },
  guestText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textDecorationLine: "underline",
  },
});