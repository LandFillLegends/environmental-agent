/**
 * Facility map screen — displays nearby disposal facilities on a map.
 *
 * Native (iOS/Android): Full-screen MapView with markers per facility.
 * Web: Falls back to a scrollable list of FacilityCards (react-native-maps doesn't support web).
 */

import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FacilityCard } from '@/components/facility-card';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { DisposalFacility } from '@/types/classification';

// Only import MapView on native platforms
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

export default function FacilityMapScreen() {
  const { facilities: facilitiesParam, itemName, materialType } =
    useLocalSearchParams<{ facilities: string; itemName: string; materialType: string }>();
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

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

  // Web fallback or no coordinates available — show list view
  if (Platform.OS === 'web' || facilitiesWithCoords.length === 0) {
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

  // Native map view
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {facilitiesWithCoords.map((f, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: f.latitude!, longitude: f.longitude! }}
            title={f.name}
            description={f.address}
            onCalloutPress={() => setSelectedFacility(f)}
            onPress={() => setSelectedFacility(f)}
          />
        ))}
      </MapView>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.pill}>
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
          <TouchableOpacity onPress={() => setSelectedFacility(null)} style={styles.dismissButton}>
            <ThemedText style={[styles.dismissText, { color: textColor }]}>Dismiss</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // List view styles
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
  // Map overlay styles
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
