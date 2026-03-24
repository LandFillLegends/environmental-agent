import { Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { DisposalFacility } from '@/types/classification';

interface FacilityCardProps {
  facility: DisposalFacility;
}

function openDirections(facility: DisposalFacility) {
  const { latitude, longitude, address } = facility;
  const destination = latitude && longitude ? `${latitude},${longitude}` : encodeURIComponent(address);

  if (Platform.OS === 'ios') {
    Linking.openURL(`maps:?daddr=${destination}`);
  } else if (Platform.OS === 'android') {
    Linking.openURL(`google.navigation:q=${destination}`);
  } else {
    // Web fallback
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
  }
}

export function FacilityCard({ facility }: FacilityCardProps) {
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.card, { borderColor: `${textColor}20` }]}>
      <ThemedText type="defaultSemiBold" style={styles.name}>
        {facility.name}
      </ThemedText>
      <ThemedText style={styles.address}>{facility.address}</ThemedText>

      <View style={styles.details}>
        {facility.rating != null && (
          <ThemedText style={styles.detail}>{facility.rating.toFixed(1)} stars</ThemedText>
        )}
        {facility.phone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${facility.phone}`)}>
            <ThemedText style={[styles.detail, styles.link]}>{facility.phone}</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.directionsButton} onPress={() => openDirections(facility)}>
        <ThemedText style={styles.directionsText}>Get Directions</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  name: {
    fontSize: 15,
  },
  address: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  details: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  detail: {
    fontSize: 13,
    opacity: 0.6,
  },
  link: {
    color: '#0a7ea4',
    opacity: 1,
  },
  directionsButton: {
    marginTop: 10,
    backgroundColor: '#0a7ea4',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  directionsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
