import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY} from "@/constants/theme";
import { DISPOSAL_CATEGORIES } from "@/constants/disposal";

export type DisposalType = "recycle" | "trash" | "compost" | "hazardous" | "dropoff" | "donate";

type Size = "sm" | "lg" | "large" | "small" | "medium";

interface Props {
  category: DisposalType;
  size?: Size;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const normalizeSize = (size?: Size): "sm" | "lg" => {
  if (!size) return "sm";
  if (size === "lg" || size === "large") return "lg";
  return "sm";
};

export const DisposalBadge: React.FC<Props> = ({
  category,
  size = "sm",
  style,
  textStyle,
}) => {
  const s = normalizeSize(size);
  const meta = DISPOSAL_CATEGORIES[category];

  if (!meta) return null;

  const isLg = s === "lg";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: withAlpha(meta.color, 0.18),
          paddingHorizontal: isLg ? SPACING.md : SPACING.sm,
          paddingVertical: isLg ? SPACING.sm : 6,
        },
        style,
      ]}
    >
      <Text style={[styles.icon, { fontSize: isLg ? 16 : 13 }]}>{meta.icon}</Text>
      <Text
        style={[
          styles.label,
          {
            color: meta.color,
            fontSize: isLg ? TYPOGRAPHY.fontSize.sm : 12,
          },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {meta.label}
      </Text>
    </View>
  );
};

// helper: add alpha to hex colors like #RRGGBB
function withAlpha(hex: string, alpha: number) {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");

  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;

  return `#${normalized}${a}`;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: "flex-start",
  },
  icon: {
    // emoji icon
  },
  label: {
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
  },
});