/**
 * Facility map screen — displays nearby disposal facilities on a map.
 *
 * Native (iOS/Android): Full-screen MapView with markers per facility.
 * Web: Falls back to a scrollable list of FacilityCards (react-native-maps doesn't support web).
 */

import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FacilityCard } from '@/components/facility-card';
import { NativeMapView } from '@/components/native-map-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { DisposalFacility } from '@/types/classification';

export default function FacilityMapScreen() {
  const { facilities: facilitiesParam, itemName, materialType } =
    useLocalSearchParams<{ facilities: string; itemName: string; materialType: string }>();
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');

  const facilities: DisposalFacility[] = useMemo(() => {
    try {
      return JSON.parse(facilitiesParam || '[]');
    } catch {
      return [];
    }
  }, [facilitiesParam]);

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<DisposalFacility | null>(null);

  useEffect(() => {
    async function getUserLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {
        // Location not available — map will center on first facility
      }
    }
    getUserLocation();
  }, []);

  // Find a suitable initial region for the map
  const initialRegion = useMemo(() => {
    const firstWithCoords = facilities.find((f) => f.latitude != null && f.longitude != null);
    const center = userCoords || (firstWithCoords ? { latitude: firstWithCoords.latitude!, longitude: firstWithCoords.longitude! } : null);
    if (!center) return undefined;
    return {
      ...center,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15,
    };
  }, [userCoords, facilities]);

  const facilitiesWithCoords = facilities.filter((f) => f.latitude != null && f.longitude != null);

  // Map view when facilities have coordinates (native + web)
  if (facilitiesWithCoords.length > 0) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <NativeMapView
          facilities={facilitiesWithCoords}
          initialRegion={initialRegion}
          selectedFacility={selectedFacility}
          onSelectFacility={setSelectedFacility}
          onClose={() => router.back()}
          itemName={itemName}
        />
      </View>
    );
  }

  // No coordinates available — show list view
  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>Close</ThemedText>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
            Nearby Facilities
          </ThemedText>
          {itemName && (
            <ThemedText style={styles.headerSubtitle}>
              for {itemName} ({materialType})
            </ThemedText>
          )}
        </View>
        <View style={styles.backButton} />
      </View>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {facilities.length === 0 ? (
          <ThemedText style={styles.empty}>No facilities found.</ThemedText>
        ) : (
          facilities.map((f, i) => <FacilityCard key={i} facility={f} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  backButton: {
    width: 60,
  },
  backText: {
    color: '#0a7ea4',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
  },
  headerSubtitle: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  empty: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 40,
  },
});
