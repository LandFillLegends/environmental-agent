import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import type { DisposalFacility } from '@/types/classification';

export default function DropoffScreen() {
  const { facilities: facilitiesParam, query } = useLocalSearchParams<{
    facilities?: string;
    query?: string;
  }>();

  const facilities = useMemo<DisposalFacility[]>(() => {
    if (!facilitiesParam) return [];
    try {
      const parsed: DisposalFacility[] = JSON.parse(
        Array.isArray(facilitiesParam) ? facilitiesParam[0] : facilitiesParam
      );
      // Deduplicate by place_id or name+address
      const seen = new Set<string>();
      return parsed.filter((f) => {
        const key = f.place_id ?? `${f.name}|${f.address}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } catch {
      return [];
    }
  }, [facilitiesParam]);

  const openDirections = (facility: DisposalFacility) => {
    const url =
      facility.latitude && facility.longitude
        ? `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.address)}`;
    Linking.openURL(url);
  };

  const openMapPreview = (facility: DisposalFacility) => {
    const itemName = Array.isArray(query) ? query[0] : (query ?? '');
    router.push({
      pathname: '/facility-map',
      params: {
        facilities: JSON.stringify([facility]),
        itemName,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={20} color={COLORS.text} />
            <Text style={styles.title}>Drop-Off Locations</Text>
          </Pressable>
          <Text style={styles.subtitle}>Nearest facilities for your items</Text>
        </View>

        {/* Facility cards */}
        {facilities.length > 0 ? (
          <View style={styles.list}>
            {facilities.map((facility, i) => (
              <View key={i} style={styles.card}>
                {/* Name + rating */}
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{facility.name}</Text>
                  {facility.rating !== null && (
                    <View style={styles.ratingPill}>
                      <Text style={styles.ratingText}>⭐ {facility.rating}</Text>
                    </View>
                  )}
                </View>

                {/* Address */}
                <View style={styles.infoRow}>
                  <MaterialIcons name="place" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.infoText}>{facility.address}</Text>
                </View>

                {/* Phone */}
                {facility.phone && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="phone" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.infoText}>{facility.phone}</Text>
                  </View>
                )}

                {/* Item tag */}
                {query && (
                  <View style={styles.tagsRow}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{Array.isArray(query) ? query[0] : query}</Text>
                    </View>
                  </View>
                )}

                {/* Map Preview */}
                <Pressable
                  style={styles.mapPreview}
                  onPress={() => openMapPreview(facility)}
                >
                  <MaterialIcons name="map" size={24} color={COLORS.primary} />
                  <Text style={styles.mapPreviewText}>Map Preview</Text>
                </Pressable>

                {/* Action buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.directionsButton}
                    onPress={() => openDirections(facility)}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="near-me" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Directions</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.scheduleButton}
                    onPress={() =>
                      router.push({
                        pathname: '/schedule-dropoff',
                        params: {
                          facility: JSON.stringify(facility),
                          wasteItem: Array.isArray(query) ? query[0] : (query ?? ''),
                        },
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="calendar-today" size={18} color={COLORS.primary} />
                    <Text style={styles.scheduleButtonText}>Schedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="place" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No facilities found for this item.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },

  header: { gap: 4 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, marginLeft: 28 },

  list: { gap: SPACING.md },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },

  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SPACING.sm },
  cardTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  ratingPill: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xs },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  tag: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  mapPreview: {
    height: 120,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  mapPreviewText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm + 4,
  },
  scheduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.accentLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#fff',
  },
  scheduleButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },

  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xxl,
  },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.textSecondary },
});
