import { useState } from 'react';
import { client } from '../lib/dataClient';
import { useMe } from './useMe';
import type { Coords } from './useCurrentLocation';

export function useExpressInterest(): {
  expressInterest: (venueId: string, coords: Coords) => Promise<{ ok: boolean; error?: string }>;
  withdrawInterest: (dadInSessionId: string) => Promise<void>;
  pending: boolean;
} {
  const me = useMe();
  const [pending, setPending] = useState(false);

  async function expressInterest(venueId: string, coords: Coords) {
    if (!me.auth || !me.profile) return { ok: false, error: 'Not signed in.' };
    setPending(true);
    try {
      const { data: result, errors } = await client.mutations.validateInterest({
        venueId,
        userLat: coords.lat,
        userLng: coords.lng,
      });
      if (errors?.length || !result?.approved) {
        return { ok: false, error: result?.reason ?? errors?.[0]?.message ?? 'Validation failed.' };
      }

      const sessionId = result.sessionId!;

      // Idempotency: skip if already in session.
      const { data: existing } = await client.models.DadsInSession.list({
        filter: {
          and: [
            { sessionId: { eq: sessionId } },
            { userId: { eq: me.auth.userId } },
          ],
        },
        limit: 1,
      });
      if (existing.length > 0) return { ok: true };

      await client.models.DadsInSession.create({
        sessionId,
        userId: me.auth.userId,
        nickname: me.profile.name,
      });

      // Check if quorum is now met.
      const { data: all } = await client.models.DadsInSession.list({
        filter: { sessionId: { eq: sessionId } },
      });
      if (all.length >= 3) {
        await client.models.MeetupSession.update({
          id: sessionId,
          status: 'ACTIVE',
          quorumCount: all.length,
        });
      }

      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' };
    } finally {
      setPending(false);
    }
  }

  async function withdrawInterest(dadInSessionId: string) {
    await client.models.DadsInSession.delete({ id: dadInSessionId });
  }

  return { expressInterest, withdrawInterest, pending };
}
