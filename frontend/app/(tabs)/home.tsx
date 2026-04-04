import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useDeviceLocation } from '@/hooks/use-device-location';
import { supabase } from '@/lib/supabase';

const COMMON_ITEMS = [
  { label: 'Pizza Box', emoji: '🍕' },
  { label: 'Plastic Bottle', emoji: '🧴' },
  { label: 'Battery', emoji: '🔋' },
  { label: 'Styrofoam', emoji: '📦' },
];

const ECO_TIP = "Rinse containers before recycling — food residue can contaminate an entire batch!";

export default function HomeScreen() {
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState<string | null>(null);
  const { location: deviceLocation, loading: locationLoading } = useDeviceLocation();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const name = user?.user_metadata?.full_name ?? user?.user_metadata?.name;
      if (name) setUsername(name.split(' ')[0]);
    });
  }, []);

  const handleIdentify = useCallback(() => {
    if (!message.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/loading',
      params: {
        message: message.trim(),
        ...(deviceLocation?.locationString ? { location: deviceLocation.locationString } : {}),
      },
    });
  }, [message, deviceLocation]);

  const handleScanPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/camera',
      params: deviceLocation?.locationString ? { location: deviceLocation.locationString } : {},
    });
  }, [deviceLocation]);

  const handleCommonItem = useCallback((label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/loading',
      params: {
        message: label,
        ...(deviceLocation?.locationString ? { location: deviceLocation.locationString } : {}),
      },
    });
  }, [deviceLocation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello {username ? `${username} ` : ''}there 👋</Text>
            <Text style={styles.title}>What's in your hand?</Text>
          </View>
          <View style={styles.leafButton}>
            <Text style={styles.leafEmoji}>🌿</Text>
          </View>
        </View>

        {/* Input card */}
        <View style={styles.inputCard}>
          <View style={styles.searchRow}>
            <IconSymbol name="magnifyingglass" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.textInput}
              placeholder="Type an item to dispose..."
              placeholderTextColor={COLORS.textSecondary}
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={handleIdentify}
              returnKeyType="search"
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.identifyButton,
                (!message.trim() || locationLoading) && styles.identifyButtonDisabled,
              ]}
              onPress={handleIdentify}
              disabled={!message.trim() || locationLoading}
              activeOpacity={0.85}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.identifyIcon}>✦</Text>
                  <Text style={styles.identifyText}>Identify</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cameraButton, locationLoading && styles.cameraButtonDisabled]}
              onPress={handleScanPress}
              disabled={locationLoading}
              activeOpacity={0.85}
            >
              <IconSymbol
                name="camera"
                size={22}
                color={locationLoading ? COLORS.textSecondary : COLORS.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Common Items */}
        <Text style={styles.sectionLabel}>COMMON ITEMS</Text>
        <View style={styles.grid}>
          {COMMON_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.gridItem}
              onPress={() => handleCommonItem(item.label)}
              activeOpacity={0.75}
            >
              <Text style={styles.gridEmoji}>{item.emoji}</Text>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Eco Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Text style={styles.tipIconEmoji}>🌿</Text>
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Eco Tip of the Day</Text>
            <Text style={styles.tipBody}>{ECO_TIP}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: SPACING.lg,
    gap: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  leafButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  leafEmoji: {
    fontSize: 20,
  },

  // Input card
  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    padding: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  identifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
  },
  identifyButtonDisabled: {
    backgroundColor: COLORS.primaryLight,
    opacity: 0.5,
  },
  identifyIcon: {
    fontSize: 16,
    color: '#fff',
  },
  identifyText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  cameraButton: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cameraButtonDisabled: {
    opacity: 0.4,
  },

  // Common items
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  gridItem: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  gridEmoji: {
    fontSize: 22,
  },
  gridLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },

  // Eco tip
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: COLORS.accentLight,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipIconEmoji: {
    fontSize: 18,
  },
  tipContent: {
    flex: 1,
    gap: 4,
  },
  tipTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  tipBody: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
