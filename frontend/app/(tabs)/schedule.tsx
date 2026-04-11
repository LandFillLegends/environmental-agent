import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

export default function ScheduleTabScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
        <Text style={styles.subtitle}>Your upcoming drop-offs</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, paddingBottom: 0, gap: 4 },
  title: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.textSecondary, textAlign: 'center' },
  emptyHint: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textLight, textAlign: 'center', lineHeight: 20 },
});
