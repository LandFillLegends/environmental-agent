import React, { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING } from "@/constants/theme";

interface PageLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export const PageLayout = ({ children, showNav = true }: PageLayoutProps) => {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.pagePadding}>{children}</View>

        {showNav && (
          <View style={styles.navContainer}>
            <BottomNav />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pagePadding: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl, // give space if nav exists
  },
  navContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});