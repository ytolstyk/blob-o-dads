import { useEffect, useRef, useState } from 'react';
import { client } from '../lib/dataClient';
import { encode } from '../lib/geohash';
import { POLL_INTERVAL_MS } from '../constants/map';
import { useMe } from './useMe';

export type Coords = { lat: number; lng: number };

// Applies a random offset (metres) to a lat/lng. The bearing and magnitude are
// chosen once per session so the stored position is never the true location.
function applyMetreOffset(
  lat: number,
  lng: number,
  distanceM: number,
  bearingRad: number,
): Coords {
  const dLat = (distanceM * Math.cos(bearingRad)) / 111_320;
  const dLng =
    (distanceM * Math.sin(bearingRad)) /
    (111_320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

function randomSessionOffset(): { distanceM: number; bearingRad: number } {
  const arr = new Uint32Array(2);
  crypto.getRandomValues(arr);
  // 150–300 m magnitude, full 360° bearing
  const distanceM = 150 + (arr[0] / 0xffffffff) * 150;
  const bearingRad = (arr[1] / 0xffffffff) * 2 * Math.PI;
  return { distanceM, bearingRad };
}

// Starts a live geolocation watch + pushes the user's position (with a
// random per-session offset applied) to their User row every POLL_INTERVAL_MS.
// Pauses writes when the tab is hidden. Returns `{ coords, permissionDenied }`
// for the map to render the self marker (true position, not offset).
export function useLocationPolling(): {
  coords: Coords | null;
  permissionDenied: boolean;
} {
  const me = useMe();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(
    () => !('geolocation' in navigator),
  );
  const latestRef = useRef<Coords | null>(null);
  const profileIdRef = useRef<string | null>(null);
  // Random offset generated once per session; never written to storage.
  const sessionOffsetRef = useRef(randomSessionOffset());

  // Keep a stable reference to the current profile id so the setInterval
  // closure always writes to the right row.
  useEffect(() => {
    profileIdRef.current = me.profile?.id ?? null;
  }, [me.profile?.id]);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        latestRef.current = next;
        setCoords(next);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermissionDenied(true);
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function push() {
      if (cancelled) return;
      if (document.visibilityState !== 'visible') return;
      const c = latestRef.current;
      const id = profileIdRef.current;
      if (!c || !id) return;
      try {
        const { distanceM, bearingRad } = sessionOffsetRef.current;
        const offset = applyMetreOffset(c.lat, c.lng, distanceM, bearingRad);
        await client.models.User.update({
          id,
          lat: offset.lat,
          lng: offset.lng,
          geohashPrefix: encode(offset.lat, offset.lng),
          lastSeenAt: new Date().toISOString(),
        });
      } catch (err) {
        // Non-fatal — retry on the next tick. Log for debugging.
        console.warn('Location write failed:', err);
      }
    }

    push(); // first write on mount
    const id = setInterval(push, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') push();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return { coords, permissionDenied };
}
