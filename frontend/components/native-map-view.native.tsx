/**
 * Native-only map view for disposal facilities.
 * This file is only bundled on iOS/Android (via the .native.tsx extension).
 */

import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FacilityCard } from '@/components/facility-card';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { DisposalFacility } from '@/types/classification';

interface NativeMapViewProps {
  facilities: DisposalFacility[];
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  selectedFacility: DisposalFacility | null;
  onSelectFacility: (facility: DisposalFacility | null) => void;
  onClose: () => void;
  itemName?: string;
}

export function NativeMapView({
  facilities,
  initialRegion,
  selectedFacility,
  onSelectFacility,
  onClose,
  itemName,
}: NativeMapViewProps) {
  const insets = useSafeAreaInsets();
  const textColor = useThemeColor({}, 'text');

  return (
    <>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {facilities.map((f, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: f.latitude!, longitude: f.longitude! }}
            title={f.name}
            description={f.address}
            onCalloutPress={() => onSelectFacility(f)}
            onPress={() => onSelectFacility(f)}
          />
        ))}
      </MapView>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onClose} style={styles.pill}>
          <ThemedText style={styles.pillText}>Close</ThemedText>
        </TouchableOpacity>
        {itemName && (
          <View style={styles.pill}>
            <ThemedText style={styles.pillText} numberOfLines={1}>
              {itemName}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Bottom facility card when marker is tapped */}
      {selectedFacility && (
        <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 12 }]}>
          <FacilityCard facility={selectedFacility} />
          <TouchableOpacity onPress={() => onSelectFacility(null)} style={styles.dismissButton}>
            <ThemedText style={[styles.dismissText, { color: textColor }]}>Dismiss</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 200,
  },
  pillText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dismissButton: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  dismissText: {
    fontSize: 14,
    opacity: 0.6,
  },
});
