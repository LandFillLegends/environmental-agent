import React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { Button } from "@/components/buttons";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "@/constants/theme";

// Update path if your logo lives somewhere else
const landfillLogo = require("@/assets/landfill-logo.png");

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrap}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image source={landfillLogo} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Bottom section */}
        <View style={styles.bottom}>
          <Text style={styles.title}>
            Dispose smarter,{"\n"}live greener
          </Text>

          <Text style={styles.subtitle}>
            AI-powered disposal guidance tailored to your location and local rules.
          </Text>

          <View style={styles.actions}>
            <Button
              title="Get Started"
              onPress={() => router.push("/(auth)/permissions")}
              size="large"
              icon="🚀"
            />

            <Pressable onPress={() => router.push("/(auth)/login")} hitSlop={10}>
              <Text style={styles.link}>I already have an account</Text>
            </Pressable>
          </View>
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
    height: 240,
    borderRadius: BORDER_RADIUS.md,
  },

  bottom: {
    gap: SPACING.md,
    alignItems: "center",
    paddingBottom: SPACING.md,
  },

  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 44,
  },

  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },

  actions: {
    width: "100%",
    gap: SPACING.md,
    paddingTop: SPACING.md,
  },

  link: {
    textAlign: "center",
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textDecorationLine: "underline",
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});
