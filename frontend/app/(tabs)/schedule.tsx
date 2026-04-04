import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { getSuggestedSlots, scheduleDisposal, SlotSuggestion } from '@/services/api';
import type { DisposalFacility } from '@/types/classification';

export default function ScheduleScreen() {
  const params = useLocalSearchParams<{ facility?: string; wasteItem?: string }>();

  const facility = useMemo<DisposalFacility | null>(() => {
    const raw = Array.isArray(params.facility) ? params.facility[0] : params.facility;
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }, [params.facility]);

  const wasteItem = Array.isArray(params.wasteItem) ? params.wasteItem[0] : (params.wasteItem ?? 'waste item');

  const [slots, setSlots] = useState<SlotSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);
  const [reminder, setReminder] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedSlot, setConfirmedSlot] = useState<SlotSuggestion | null>(null);

  useEffect(() => {
    if (!facility) {
      setLoading(false);
      return;
    }
    getSuggestedSlots(facility.name, facility.address, wasteItem)
      .then((res) => {
        setSlots(res.suggestions);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Empty state — accessed directly from tab bar without facility params
  if (!facility) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyHeader}>
          <Text style={styles.emptyTitle}>Schedule</Text>
          <Text style={styles.emptySubtitle}>Your upcoming drop-offs</Text>
        </View>
        <View style={styles.emptyWrap}>
          <MaterialIcons name="calendar-today" size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>No drop-off scheduled yet.</Text>
          <Text style={styles.emptyHint}>
            Find a facility from your disposal results and tap{' '}
            <Text style={{ fontWeight: '600' }}>Schedule</Text> to book a time.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleConfirm = async () => {
    if (!facility || slots.length === 0) return;
    const slot = slots[selected];
    setConfirming(true);
    try {
      await scheduleDisposal(facility.name, facility.address, slot.date, slot.time, wasteItem);
      setConfirmedSlot(slot);
      setConfirmed(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Scheduling failed. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (confirmed && confirmedSlot) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successWrap}>
          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.successTitle}>All Set!</Text>
          <Text style={styles.successSubtitle}>
            Your drop-off is scheduled for{'\n'}
            <Text style={{ fontWeight: '700', color: COLORS.text }}>
              {confirmedSlot.day_display} at {confirmedSlot.time_display}
            </Text>
          </Text>
          {reminder && <Text style={styles.reminderPill}>🔔 Reminder set</Text>}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(tabs)/home')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding the best times in your calendar…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error screen ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <MaterialIcons name="error-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main screen ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={styles.backText}></Text>
          </Pressable>
          <Text style={styles.title}>Schedule Drop-Off</Text>
          {facility && (
            <>
              <Text style={styles.subtitle}>{facility.name}</Text>
              <Text style={styles.facilityAddress}>{facility.address}</Text>
            </>
          )}
        </View>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="auto-awesome" size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>
            AI picked these times based on your Google Calendar — no conflicts.
          </Text>
        </View>

        {/* Time slots */}
        <View style={styles.slotsWrap}>
          {slots.map((slot, i) => {
            const isSelected = selected === i;
            return (
              <Pressable
                key={`${slot.date}-${slot.time}`}
                onPress={() => setSelected(i)}
                style={[styles.slotCard, isSelected ? styles.slotSelected : styles.slotUnselected]}
              >
                <View style={styles.slotLeft}>
                  <Text style={styles.slotDay}>{slot.day_display}</Text>
                  <View style={styles.slotTimeRow}>
                    <MaterialIcons name="schedule" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.slotTime}>{slot.time_display}</Text>
                  </View>
                  <Text style={styles.slotReason}>{slot.reason}</Text>
                </View>

                <View style={styles.slotRight}>
                  {slot.label === 'Recommended' && (
                    <View style={styles.recommendedPill}>
                      <Text style={styles.recommendedText}>Recommended</Text>
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.selectedCheck}>
                      <Text style={styles.selectedCheckText}>✓</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Reminder toggle */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderLeft}>
            <MaterialIcons name="notifications" size={20} color={COLORS.primary} />
            <Text style={styles.reminderLabel}>Set reminder</Text>
          </View>
          <Switch
            value={reminder}
            onValueChange={setReminder}
            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
            thumbColor={reminder ? COLORS.primary : COLORS.textSecondary}
          />
        </View>

        {/* Confirm */}
        <TouchableOpacity
          style={[styles.primaryButton, confirming && styles.primaryButtonDisabled]}
          onPress={handleConfirm}
          activeOpacity={0.85}
          disabled={confirming || slots.length === 0}
        >
          {confirming ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="event" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Add to Calendar</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Before You Go */}
        <View style={styles.beforeCard}>
          <Text style={styles.beforeTitle}>📌 Before You Go</Text>
          <Text style={styles.beforeItem}>• Bring a valid ID if required</Text>
          <Text style={styles.beforeItem}>• Keep items separated if needed</Text>
          <Text style={styles.beforeItem}>• Check facility website for any updates</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING.lg },
  loadingText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  errorText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.error, textAlign: 'center', lineHeight: 22 },

  header: { gap: 4 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.xs },
  backText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  title: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.textSecondary },
  facilityAddress: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textLight },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.accentLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  infoText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text, lineHeight: 20 },

  slotsWrap: { gap: SPACING.sm },
  slotCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  slotSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.accentLight },
  slotUnselected: { borderColor: COLORS.border, backgroundColor: COLORS.surface },
  slotLeft: { gap: 4 },
  slotDay: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  slotTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  slotTime: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  slotReason: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textLight, fontStyle: 'italic' },
  slotRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  recommendedPill: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  recommendedText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary },
  selectedCheck: {
    width: 22, height: 22, borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  selectedCheckText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  reminderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  reminderLabel: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text },

  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.semibold },

  beforeCard: {
    backgroundColor: COLORS.accentLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  beforeTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text, marginBottom: SPACING.xs },
  beforeItem: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text, lineHeight: 20 },

  successWrap: { flex: 1, padding: SPACING.lg, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  successCircle: {
    width: 80, height: 80, borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  successCheck: { fontSize: 38, color: COLORS.primary, fontWeight: '700' },
  successTitle: { fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  successSubtitle: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  reminderPill: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.primary, marginBottom: SPACING.md },

  emptyHeader: { padding: SPACING.lg, paddingBottom: 0, gap: 4 },
  emptyTitle: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  emptySubtitle: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  emptyWrap: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.textSecondary, textAlign: 'center' as const },
  emptyHint: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textLight, textAlign: 'center' as const, lineHeight: 20 },
});
