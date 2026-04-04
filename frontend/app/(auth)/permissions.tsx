import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

const PERMISSIONS = [
  {
    icon: 'camera-alt' as const,
    label: 'Camera',
    description: 'Scan waste items instantly',
  },
  {
    icon: 'location-on' as const,
    label: 'Location',
    description: 'Find nearby disposal sites',
  },
];

export default function PermissionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <MaterialIcons name="verified-user" size={56} color={COLORS.primary} />
        </View>

        {/* Copy */}
        <View style={styles.copy}>
          <Text style={styles.headline}>Enable Permissions</Text>
          <Text style={styles.subtitle}>
            Allow access to get the most out of Landfill Legends.
          </Text>
        </View>

        {/* Permission items */}
        <View style={styles.permissionList}>
          {PERMISSIONS.map(({ icon, label, description }) => (
            <View key={label} style={styles.permissionRow}>
              <View style={styles.permissionIconWrap}>
                <MaterialIcons name={icon} size={22} color={COLORS.primary} />
              </View>
              <View style={styles.permissionText}>
                <Text style={styles.permissionLabel}>{label}</Text>
                <Text style={styles.permissionDesc}>{description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Enable Permissions</Text>
          </TouchableOpacity>

          <Pressable onPress={() => router.replace('/')} style={styles.skipLink}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.xl,
  },

  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  copy: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headline: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },

  permissionList: {
    width: '100%',
    gap: SPACING.sm,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  permissionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    gap: 2,
  },
  permissionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  permissionDesc: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },

  actions: {
    width: '100%',
    gap: SPACING.md,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  skipLink: {
    paddingVertical: SPACING.sm,
  },
  skipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
});
