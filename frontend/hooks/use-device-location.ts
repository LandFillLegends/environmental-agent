import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

interface DeviceLocation {
  latitude: number;
  longitude: number;
  locationString: string;
}

interface UseDeviceLocationResult {
  location: DeviceLocation | null;
  loading: boolean;
  error: string | null;
}

export function useDeviceLocation(): UseDeviceLocationResult {
  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function getLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (cancelled) return;

        const { latitude, longitude } = position.coords;

        // Reverse geocode to get a human-readable location string
        const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });

        let locationString = '';
        if (geo) {
          const parts = [geo.city, geo.region, geo.postalCode].filter(Boolean);
          locationString = parts.join(', ');
        }

        if (!cancelled) {
          setLocation({ latitude, longitude, locationString });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to get location');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    getLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  return { location, loading, error };
}
