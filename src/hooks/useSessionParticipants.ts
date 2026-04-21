import { useEffect, useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/dataClient';

export type DadInSession = Schema['DadsInSession']['type'];

export function useSessionParticipants(sessionId: string | null): DadInSession[] {
  const [participants, setParticipants] = useState<DadInSession[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    const sub = client.models.DadsInSession.observeQuery({
      filter: { sessionId: { eq: sessionId } },
    }).subscribe({
      next: ({ items }) => setParticipants(items),
    });
    return () => {
      sub.unsubscribe();
      setParticipants([]);
    };
  }, [sessionId]);

  return participants;
}
