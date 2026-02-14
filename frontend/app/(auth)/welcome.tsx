import React from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Button } from "@/components/buttons"; 
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "@/constants/theme";

type FeatureProps = {
  icon: string;
  title: string;
  description: string;
};

export default function Welcome() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.heroIcon}>🌍</Text>
            <Text style={styles.recycleIcon}>♻️</Text>
          </View>

          <Text style={styles.title}>Landfill Legends</Text>
          <Text style={styles.subtitle}>
            Your AI-powered disposal assistant for a cleaner planet
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <Feature
            icon="📸"
            title="Snap & Identify"
            description="Take a photo or type what you need to dispose of"
          />
          <Feature
            icon="📍"
            title="Local Rules"
            description="Get disposal guidance based on your location"
          />
          <Feature
            icon="📅"
            title="Easy Scheduling"
            description="Schedule drop-offs with integrated calendar"
          />
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <Button title="Get Started" onPress={handleGetStarted} size="large" icon="🚀" />
          <Text style={styles.disclaimer}>
            Join thousands making sustainable disposal easy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    justifyContent: "space-between",
  },
  heroSection: {
    alignItems: "center",
    paddingTop: SPACING.xxl,
  },
  iconContainer: {
    position: "relative",
    marginBottom: SPACING.xl,
  },
  heroIcon: {
    fontSize: 100,
  },
  recycleIcon: {
    fontSize: 40,
    position: "absolute",
    bottom: -10,
    right: -10,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.surface,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.accentLight,
    textAlign: "center",
    lineHeight: 28,
    paddingHorizontal: SPACING.md,
  },
  features: {
    gap: SPACING.lg,
  },
  feature: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    gap: SPACING.md,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.surface,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.accentLight,
    lineHeight: 20,
  },
  ctaSection: {
    gap: SPACING.md,
    alignItems: "center",
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.accentLight,
    textAlign: "center",
  },
});