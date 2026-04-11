import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import type { ClassificationResponse } from '@/types/classification';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ResultsScreen() {
  const { result } = useLocalSearchParams<{ result?: string }>();

  const data = useMemo<ClassificationResponse | null>(() => {
    const raw = Array.isArray(result) ? result[0] : result;
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [result]);

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>No results to display.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.primaryButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const itemMap = new Map(data.items.map((item) => [item.item_name, item]));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/home')}>
            <MaterialIcons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Results</Text>
          <Text style={styles.subtitle}>
            Found {data.total_items} {data.total_items === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {/* Item cards */}
        <View style={styles.cards}>
          {data.disposal_instructions.map((instruction, i) => {
            const item = itemMap.get(instruction.item_name);
            const confidence = item ? Math.round(item.confidence_score * 100) : null;
            const isHazardous = item?.is_hazardous ?? false;
            const isSoiled = item?.is_soiled ?? false;
            const location = item?.location;
            const hasFacilities = instruction.facilities.length > 0;

            return (
              <View key={i} style={styles.card}>
                {/* Card header row */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleGroup}>
                    <Text style={styles.itemName}>{instruction.item_name}</Text>
                    <Text style={styles.materialType}>{instruction.material_type}</Text>
                  </View>
                  {confidence !== null && (
                    <View
                      style={[
                        styles.confidenceBadge,
                        { backgroundColor: confidence >= 70 ? COLORS.primary : COLORS.warning },
                      ]}
                    >
                      <Text style={styles.confidenceText}>{confidence}%</Text>
                    </View>
                  )}
                </View>

                {/* Warnings */}
                {isHazardous && (
                  <View style={[styles.alertRow, { backgroundColor: COLORS.alertHazardous }]}>
                    <MaterialIcons name="warning" size={15} color={COLORS.hazardous} />
                    <Text style={[styles.alertText, { color: COLORS.hazardous }]}>
                      Hazardous — do not place in regular trash
                    </Text>
                  </View>
                )}
                {isSoiled && (
                  <View style={[styles.alertRow, { backgroundColor: COLORS.alertWarning }]}>
                    <MaterialIcons name="info-outline" size={15} color={COLORS.warning} />
                    <Text style={[styles.alertText, { color: COLORS.warning }]}>
                      Item may be soiled — clean before recycling if possible
                    </Text>
                  </View>
                )}

                {/* Disposal instruction */}
                <View style={styles.instructionBox}>
                  <Text style={styles.instructionLabel}>How to dispose:</Text>
                  <Text style={styles.instructionText}>{instruction.instruction}</Text>
                </View>

                {/* Location */}
                {location ? (
                  <Text style={styles.locationText}>Location: {location}</Text>
                ) : null}

                {/* Facilities CTA */}
                {hasFacilities && (
                  <TouchableOpacity
                    style={styles.facilitiesButton}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/dropoff',
                        params: {
                          query: instruction.item_name,
                          facilities: JSON.stringify(instruction.facilities),
                        },
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="place" size={18} color="#fff" />
                    <Text style={styles.facilitiesButtonText}>View Nearby Facilities</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Eco Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💚 Eco Tips</Text>
          <Text style={styles.tipLine}>• Consider reusable alternatives to reduce waste</Text>
          <Text style={styles.tipLine}>• Clean recyclables to prevent contamination</Text>
          <Text style={styles.tipLine}>• Check with your building for specific guidelines</Text>
        </View>

        {/* Search Another Item */}
        <TouchableOpacity style={styles.searchAnotherButton} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.searchAnotherText}>Search Another Item</Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            These are AI-generated suggestions. Always verify with your local waste management guidelines.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, gap: SPACING.lg },

  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING.lg },
  errorText: { fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.textSecondary },

  // Header
  header: { gap: SPACING.xs },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.xs },
  backText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },

  // Cards
  cards: { gap: SPACING.md },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SPACING.sm },
  cardTitleGroup: { flex: 1, gap: 2 },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  materialType: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  confidenceBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
  },

  // Alerts
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  alertText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.medium },

  // Instruction
  instructionBox: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  instructionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  instructionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  locationText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },

  // Facilities button
  facilitiesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.recycle,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm + 2,
  },
  facilitiesButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#fff',
  },

  // Primary button (error state)
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // Eco Tips
  tipsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  tipsTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  tipLine: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Search Another Item
  searchAnotherButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center' as const,
    backgroundColor: COLORS.surface,
  },
  searchAnotherText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Disclaimer
  disclaimer: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  disclaimerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
