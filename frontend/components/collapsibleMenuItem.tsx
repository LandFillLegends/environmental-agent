import React, { ReactNode, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ViewStyle,
} from "react-native";

import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "@/constants/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CollapsibleMenuItemProps = {
  /** Left icon: simplest is emoji string like "📍". You can also pass a React element. */
  icon?: string | ReactNode;
  label: string;
  children: ReactNode;
  /** Optional container style override */
  style?: ViewStyle;
  /** Optional: start expanded */
  defaultOpen?: boolean;
};

export default function CollapsibleMenuItem({
  icon,
  label,
  children,
  style,
  defaultOpen = false,
}: CollapsibleMenuItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => !prev);
  };

  return (
    <View style={[styles.wrapper, style]}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={styles.row}>
        <View style={styles.left}>
          {typeof icon === "string" ? (
            <Text style={styles.iconText}>{icon}</Text>
          ) : (
            icon ?? <Text style={styles.iconText}>•</Text>
          )}

          <Text style={styles.label}>{label}</Text>
        </View>

        <Text style={styles.chevron}>{open ? "▾" : "▸"}</Text>
      </TouchableOpacity>

      {open ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surface,
  },
  row: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  },
  iconText: {
    fontSize: 18,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  chevron: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginLeft: SPACING.md,
  },
  content: {
    overflow: "hidden",
    paddingBottom: SPACING.sm,
  },
});
