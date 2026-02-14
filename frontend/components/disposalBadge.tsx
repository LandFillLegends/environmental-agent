import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/theme';
import { DISPOSAL_CATEGORIES } from '@/constants/disposal';

export const DisposalBadge = ({ category, size = 'medium' }) => {
  const categoryInfo = DISPOSAL_CATEGORIES[category] || DISPOSAL_CATEGORIES.trash;
  
  const isLarge = size === 'large';
  
  return (
    <View style={[
      styles.badge,
      { backgroundColor: categoryInfo.color },
      isLarge && styles.badgeLarge,
    ]}>
      <Text style={[styles.icon, isLarge && styles.iconLarge]}>
        {categoryInfo.icon}
      </Text>
      <Text style={[styles.label, isLarge && styles.labelLarge]}>
        {categoryInfo.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    alignSelf: 'flex-start',
  },
  badgeLarge: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  icon: {
    fontSize: 16,
  },
  iconLarge: {
    fontSize: 24,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  labelLarge: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
});
