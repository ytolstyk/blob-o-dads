import { useEffect, useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/dataClient';
import { nearbyPrefixes } from '../lib/geohash';
import { haversineMiles } from '../lib/distance';
import { NEARBY_RADIUS_MILES } from '../constants/map';
import type { Coords } from './useLocationPolling';

export type NearbyUser = Schema['User']['type'];

// Subscribes to every User row whose geohashPrefix is in our 9-cell neighborhood,
// then haversine-filters to NEARBY_RADIUS_MILES and drops self.
export function useNearbyUsers(
  center: Coords | null,
  selfUserId: string | null,
): NearbyUser[] {
  const [users, setUsers] = useState<NearbyUser[]>([]);
  // Stable key — only changes when the geohash cell neighborhood shifts.
  const prefixKey = center ? nearbyPrefixes(center.lat, center.lng).join(',') : null;

  useEffect(() => {
    if (!center) return;
    const prefixes = nearbyPrefixes(center.lat, center.lng);
    const sub = client.models.User.observeQuery({
      filter: { or: prefixes.map((p) => ({ geohashPrefix: { eq: p } })) },
    }).subscribe({
      next: ({ items }) => {
        const nearby = items.filter((u) => {
          if (!u.userId || u.userId === selfUserId) return false;
          if (u.lat == null || u.lng == null) return false;
          return (
            haversineMiles(center, { lat: u.lat, lng: u.lng }) <=
            NEARBY_RADIUS_MILES
          );
        });
        setUsers(nearby);
      },
    });
    return () => sub.unsubscribe();
    // Re-subscribe only when the prefix set changes, not on every tiny coord move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefixKey, selfUserId]);

  return users;
}
