import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { getSuggestedSlots, scheduleDisposal, SlotSuggestion } from '@/services/api';
import type { ClassificationResponse, DisposalFacility } from '@/types/classification';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

type SchedulePhase =
  | { phase: 'idle' }
  | { phase: 'loading'; itemIndex: number }
  | {
      phase: 'suggesting';
      itemIndex: number;
      facility: DisposalFacility;
      slot: SlotSuggestion;
      allFacilities: DisposalFacility[];
      itemName: string;
    }
  | {
      phase: 'confirming';
      itemIndex: number;
      facility: DisposalFacility;
      slot: SlotSuggestion;
      allFacilities: DisposalFacility[];
      itemName: string;
    }
  | { phase: 'success'; itemIndex: number; facilityName: string; slot: SlotSuggestion };

export default function ResultsScreen() {
  const { result } = useLocalSearchParams<{ result?: string }>();
  const [scheduleState, setScheduleState] = useState<SchedulePhase>({ phase: 'idle' });

  const data = useMemo<ClassificationResponse | null>(() => {
    const raw = Array.isArray(result) ? result[0] : result;
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [result]);

  const handleSchedule = async (itemIndex: number, facilities: DisposalFacility[], itemName: string) => {
    // Pick best facility by rating, fall back to first
    const best = [...facilities].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
    setScheduleState({ phase: 'loading', itemIndex });
    try {
      const res = await getSuggestedSlots(best.name, best.address, itemName, userTimezone);
      const recommended = res.suggestions.find((s) => s.label === 'Recommended') ?? res.suggestions[0];
      setScheduleState({
        phase: 'suggesting',
        itemIndex,
        facility: best,
        slot: recommended,
        allFacilities: facilities,
        itemName,
      });
    } catch {
      // Fall back to manual selection on error
      router.push({
        pathname: '/(tabs)/dropoff',
        params: { query: itemName, facilities: JSON.stringify(facilities) },
      });
    }
  };

  const handleConfirm = async () => {
    if (scheduleState.phase !== 'suggesting') return;
    const { itemIndex, facility, slot, allFacilities, itemName } = scheduleState;
    setScheduleState({ phase: 'confirming', itemIndex, facility, slot, allFacilities, itemName });
    try {
      await scheduleDisposal(facility.name, facility.address, slot.date, slot.time, itemName, userTimezone);
      setScheduleState({ phase: 'success', itemIndex, facilityName: facility.name, slot });
    } catch {
      // Fall back to manual flow on error
      router.push({
        pathname: '/(tabs)/dropoff',
        params: { query: itemName, facilities: JSON.stringify(allFacilities) },
      });
    }
  };

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

            const isLoading = scheduleState.phase === 'loading' && scheduleState.itemIndex === i;
            const isSuggesting = scheduleState.phase === 'suggesting' && scheduleState.itemIndex === i;
            const isConfirming = scheduleState.phase === 'confirming' && scheduleState.itemIndex === i;
            const isSuccess = scheduleState.phase === 'success' && scheduleState.itemIndex === i;

            // Safe access to suggestion/success data for this item
            const suggestion =
              (isSuggesting || isConfirming)
                ? (scheduleState as Extract<SchedulePhase, { phase: 'suggesting' | 'confirming' }>)
                : null;
            const success = isSuccess
              ? (scheduleState as Extract<SchedulePhase, { phase: 'success' }>)
              : null;

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

                {/* Facilities CTA — three states: default button / suggestion card / success */}
                {hasFacilities && (
                  isSuccess && success ? (
                    <View style={styles.successCard}>
                      <View style={styles.successRow}>
                        <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />
                        <Text style={styles.successLabel}>Scheduled!</Text>
                      </View>
                      <Text style={styles.successDetail}>{success.facilityName}</Text>
                      <Text style={styles.successTime}>
                        {success.slot.day_display} at {success.slot.time_display}
                      </Text>
                    </View>
                  ) : suggestion ? (
                    <View style={styles.suggestionCard}>
                      <View style={styles.suggestionHeader}>
                        <MaterialIcons name="auto-awesome" size={15} color={COLORS.primary} />
                        <Text style={styles.suggestionHeaderText}>I suggest scheduling at:</Text>
                      </View>
                      <Text style={styles.suggestionFacility}>{suggestion.facility.name}</Text>
                      <Text style={styles.suggestionAddress}>{suggestion.facility.address}</Text>
                      <View style={styles.suggestionTimeRow}>
                        <MaterialIcons name="schedule" size={13} color={COLORS.textSecondary} />
                        <Text style={styles.suggestionTime}>
                          {suggestion.slot.day_display} at {suggestion.slot.time_display}
                        </Text>
                      </View>
                      {suggestion.slot.reason ? (
                        <Text style={styles.suggestionReason}>{suggestion.slot.reason}</Text>
                      ) : null}
                      <View style={styles.suggestionActions}>
                        <TouchableOpacity
                          style={[styles.confirmButton, isConfirming && styles.buttonDisabled]}
                          onPress={handleConfirm}
                          disabled={isConfirming}
                          activeOpacity={0.85}
                        >
                          {isConfirming ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <MaterialIcons name="event" size={15} color="#fff" />
                              <Text style={styles.confirmButtonText}>Confirm</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.moreOptionsButton, isConfirming && styles.buttonDisabled]}
                          disabled={isConfirming}
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
                          <Text style={styles.moreOptionsText}>More options</Text>
                          <MaterialIcons name="chevron-right" size={15} color={COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.facilitiesButton}
                      onPress={() => handleSchedule(i, instruction.facilities, instruction.item_name)}
                      disabled={isLoading}
                      activeOpacity={0.85}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialIcons name="calendar-today" size={18} color="#fff" />
                          <Text style={styles.facilitiesButtonText}>Schedule Drop-Off</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )
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

  // Facilities button (default state)
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

  // Agent suggestion card
  suggestionCard: {
    backgroundColor: COLORS.accentLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  suggestionHeaderText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionFacility: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  suggestionAddress: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  suggestionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  suggestionTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  suggestionReason: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
  },
  confirmButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#fff',
  },
  moreOptionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  moreOptionsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  buttonDisabled: { opacity: 0.6 },

  // Inline success state
  successCard: {
    backgroundColor: COLORS.accentLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  successLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  successDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  successTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
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
