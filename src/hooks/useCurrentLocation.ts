import { useEffect, useState } from 'react';

export type Coords = { lat: number; lng: number };

const HAS_GEO = 'geolocation' in navigator;

export function useCurrentLocation(): {
  coords: Coords | null;
  permissionDenied: boolean;
  loading: boolean;
} {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(HAS_GEO);

  useEffect(() => {
    if (!HAS_GEO) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setPermissionDenied(true);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }, []);

  return { coords, permissionDenied, loading };
}
