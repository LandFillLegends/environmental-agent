/**
 * Web map view using Leaflet (react-leaflet).
 * The web bundler picks this file (no .native suffix).
 */

import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

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

/** Convert a latitudeDelta to an approximate Leaflet zoom level. */
function deltaToZoom(latDelta: number): number {
  // ~360 / 2^zoom ≈ latDelta → zoom ≈ log2(360 / latDelta)
  return Math.round(Math.log2(360 / latDelta));
}

export function NativeMapView({
  facilities,
  initialRegion,
  selectedFacility,
  onSelectFacility,
  onClose,
  itemName,
}: NativeMapViewProps) {
  const textColor = useThemeColor({}, 'text');
  const [leafletReady, setLeafletReady] = useState(false);
  const mapRef = useRef<any>(null);
  const leafletModules = useRef<any>(null);

  const center: [number, number] = initialRegion
    ? [initialRegion.latitude, initialRegion.longitude]
    : [33.9519, -84.5501]; // fallback: Marietta, GA
  const zoom = initialRegion ? deltaToZoom(initialRegion.latitudeDelta) : 12;

  // Dynamically import react-leaflet + leaflet so SSR/native never touches them
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [rl, L] = await Promise.all([
        import('react-leaflet'),
        import('leaflet'),
      ]);

      // Inject Leaflet CSS once
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Fix default marker icons (Leaflet's icon URLs break with bundlers)
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      if (!cancelled) {
        leafletModules.current = { ...rl, L };
        setLeafletReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!leafletReady || !leafletModules.current) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ThemedText>Loading map…</ThemedText>
      </View>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = leafletModules.current;

  return (
    <View style={styles.container}>
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {facilities.map((f, i) => (
          <Marker
            key={i}
            position={[f.latitude!, f.longitude!]}
            eventHandlers={{
              click: () => onSelectFacility(f),
            }}
          >
            <Popup>
              <strong>{f.name}</strong>
              <br />
              {f.address}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Top bar */}
      <View style={styles.topBar}>
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
        <View style={styles.bottomCard}>
          <FacilityCard facility={selectedFacility} />
          <TouchableOpacity onPress={() => onSelectFacility(null)} style={styles.dismissButton}>
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
    position: 'relative' as any,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 1000,
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
    zIndex: 1000,
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
