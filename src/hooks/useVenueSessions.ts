import { useEffect, useRef, useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/dataClient';

export type MeetupSession = Schema['MeetupSession']['type'];

export function useVenueSessions(
  venueIds: string[],
  sessionDate: string,
): Record<string, MeetupSession | undefined> {
  const [sessions, setSessions] = useState<Record<string, MeetupSession>>({});
  const stableKey = [...venueIds].sort().join(',');
  const prevKey = useRef('');

  useEffect(() => {
    if (!venueIds.length || stableKey === prevKey.current) return;
    prevKey.current = stableKey;

    const sub = client.models.MeetupSession.observeQuery({
      filter: {
        and: [
          { sessionDate: { eq: sessionDate } },
          {
            or: venueIds.map((id) => ({ venueId: { eq: id } })),
          },
        ],
      },
    }).subscribe({
      next: ({ items }) => {
        const map: Record<string, MeetupSession> = {};
        for (const s of items) {
          // Keep only the most-recent non-expired session per venue.
          const existing = map[s.venueId];
          if (!existing || new Date(s.createdAt) > new Date(existing.createdAt)) {
            map[s.venueId] = s;
          }
        }
        setSessions(map);
      },
    });

    return () => sub.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey, sessionDate]);

  return sessions;
}
