import { useState } from 'react';
import { client } from '../lib/dataClient';

export function useVoteSlot(): {
  vote: (dadInSessionId: string, slot: 1 | 2 | 3) => Promise<boolean>;
  pending: boolean;
} {
  const [pending, setPending] = useState(false);

  async function vote(dadInSessionId: string, slot: 1 | 2 | 3): Promise<boolean> {
    setPending(true);
    try {
      const { data } = await client.models.DadsInSession.update({
        id: dadInSessionId,
        voteSlot: slot,
      });
      return !!data;
    } catch {
      return false;
    } finally {
      setPending(false);
    }
  }

  return { vote, pending };
}
