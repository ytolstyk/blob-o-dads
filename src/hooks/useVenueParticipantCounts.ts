import { useEffect, useRef, useState } from 'react';
import { client } from '../lib/dataClient';
import type { MeetupSession } from './useVenueSessions';

export function useVenueParticipantCounts(
  sessionsByVenueId: Record<string, MeetupSession | undefined>,
): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const activeSessionIds = Object.values(sessionsByVenueId)
    .filter((s): s is MeetupSession => s !== undefined && s.status !== 'EXPIRED')
    .map((s) => s.id);
  const stableKey = [...activeSessionIds].sort().join(',');
  const prevKey = useRef('');

  useEffect(() => {
    if (stableKey === prevKey.current) return;
    prevKey.current = stableKey;

    if (!activeSessionIds.length) return;

    const sub = client.models.DadsInSession.observeQuery({
      filter: {
        or: activeSessionIds.map((id) => ({ sessionId: { eq: id } })),
      },
    }).subscribe({
      next: ({ items }) => {
        const map: Record<string, number> = {};
        for (const p of items) {
          map[p.sessionId] = (map[p.sessionId] ?? 0) + 1;
        }
        // Remap from sessionId → count to venueId → count.
        const byVenue: Record<string, number> = {};
        for (const [venueId, session] of Object.entries(sessionsByVenueId)) {
          if (session) byVenue[venueId] = map[session.id] ?? 0;
        }
        setCounts(byVenue);
      },
    });

    return () => sub.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey]);

  return counts;
}
