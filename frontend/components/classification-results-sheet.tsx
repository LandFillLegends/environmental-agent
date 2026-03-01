/**
 * Bottom sheet that displays waste classification results and disposal instructions.
 *
 * Slides up from the bottom of the screen after a photo is classified.
 * Uses @gorhom/bottom-sheet for native-feeling gesture handling.
 */

import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { DisposalInstruction, WasteClassificationItem } from '@/types/classification';

interface ClassificationResultsSheetProps {
  items: WasteClassificationItem[];
  disposalInstructions: DisposalInstruction[];
  /** Ref to control the sheet programmatically (expand/close) */
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onClose: () => void;
}

export function ClassificationResultsSheet({
  items,
  disposalInstructions,
  bottomSheetRef,
  onClose,
}: ClassificationResultsSheetProps) {
  // Heights the sheet can snap to — 50% of screen or 90% (fully expanded)
  const snapPoints = useMemo(() => ['50%', '90%'], []);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  // Backdrop = the dark overlay behind the sheet. Tapping it closes the sheet.
  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  /**
   * Find the disposal instruction matching a given item.
   * We match on item_name since that's what the backend returns.
   */
  const getInstruction = (itemName: string): string | undefined => {
    return disposalInstructions.find((d) => d.item_name === itemName)?.instruction;
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1} // Start closed (-1 = hidden)
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor }}
      handleIndicatorStyle={{ backgroundColor: textColor, opacity: 0.3 }}
    >
      <BottomSheetScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Results</ThemedText>
          <ThemedText style={styles.subtitle}>
            Found {items.length} {items.length === 1 ? 'item' : 'items'}
          </ThemedText>
        </View>

        {/* One card per classified item */}
        {items.map((item, index) => {
          const instruction = getInstruction(item.item_name);

          return (
            <View
              key={index}
              style={[styles.card, { borderColor: item.is_hazardous ? '#ff3b30' : '#e0e0e0' }]}
            >
              {/* Item header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <ThemedText type="defaultSemiBold" style={styles.itemName}>
                    {item.item_name}
                  </ThemedText>
                  <ThemedText style={styles.materialType}>{item.material_type}</ThemedText>
                </View>
                <View style={styles.confidenceBadge}>
                  <ThemedText style={styles.confidenceText}>
                    {Math.round(item.confidence_score * 100)}%
                  </ThemedText>
                </View>
              </View>

              {/* Warning badges */}
              {(item.is_hazardous || item.is_soiled) && (
                <View style={styles.badges}>
                  {item.is_hazardous && (
                    <View style={[styles.badge, { backgroundColor: '#ff3b30' }]}>
                      <ThemedText style={styles.badgeText}>Hazardous</ThemedText>
                    </View>
                  )}
                  {item.is_soiled && (
                    <View style={[styles.badge, { backgroundColor: '#ff9500' }]}>
                      <ThemedText style={styles.badgeText}>Soiled</ThemedText>
                    </View>
                  )}
                </View>
              )}

              {/* Disposal instruction */}
              {instruction && (
                <View style={styles.instructionBox}>
                  <ThemedText type="defaultSemiBold" style={styles.instructionLabel}>
                    How to dispose:
                  </ThemedText>
                  <ThemedText style={styles.instructionText}>{instruction}</ThemedText>
                </View>
              )}

              {/* Location if detected */}
              {item.location && (
                <ThemedText style={styles.location}>Location: {item.location}</ThemedText>
              )}
            </View>
          );
        })}

        {/* Footer disclaimer */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            These are AI-generated suggestions. Always verify with your local waste management
            guidelines.
          </ThemedText>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderText: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 18,
  },
  materialType: {
    opacity: 0.6,
    marginTop: 2,
    fontSize: 14,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(10, 126, 164, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionBox: {
    marginTop: 12,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  instructionLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  location: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.5,
  },
  footer: {
    marginTop: 12,
    marginBottom: 40,
    padding: 12,
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 18,
  },
});
