import { useEffect, useRef, useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/dataClient';
import type { Coords } from './useCurrentLocation';

export type Venue = Schema['Venue']['type'];

const CACHE_TTL_MS = 15 * 60 * 1000;

export function useNearbyVenues(coords: Coords | null): {
  venues: Venue[];
  loading: boolean;
  error: string | null;
} {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchAt = useRef<number>(0);
  const lastCoords = useRef<Coords | null>(null);

  useEffect(() => {
    if (!coords) return;
    const now = Date.now();
    const sameCoords =
      lastCoords.current?.lat === coords.lat && lastCoords.current?.lng === coords.lng;
    if (sameCoords && now - lastFetchAt.current < CACHE_TTL_MS) return;

    lastCoords.current = coords;
    lastFetchAt.current = now;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { data: venueIds, errors } = await client.queries.fetchNearbyVenues({
          lat: coords.lat,
          lng: coords.lng,
        });
        if (errors?.length) throw new Error(errors[0].message);
        if (!venueIds?.length) {
          setVenues([]);
          return;
        }

        const results = await Promise.all(
          venueIds.map((id) => client.models.Venue.get({ id: id! })),
        );
        setVenues(
          results
            .map((r) => r.data)
            .filter((v) => v !== null && v !== undefined) as Venue[],
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load venues.');
      } finally {
        setLoading(false);
      }
    })();
  }, [coords]);

  return { venues, loading, error };
}
