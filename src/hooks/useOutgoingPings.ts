import { useEffect, useState } from 'react';
import { client } from '../lib/dataClient';
import { useMe } from './useMe';
import type { Ping } from './usePingInbox';

// Subscribes to pings the signed-in user has sent. Used to render their own
// outgoing ping lines on the map before the recipient joins the group.
export function useOutgoingPings(): Ping[] {
  const me = useMe();
  const [pings, setPings] = useState<Ping[]>([]);

  useEffect(() => {
    if (!me.auth) return;
    const sub = client.models.Ping.observeQuery({
      filter: { fromUserId: { eq: me.auth.userId } },
    }).subscribe({
      next: ({ items }) => setPings(items),
    });
    return () => sub.unsubscribe();
  }, [me.auth]);

  return pings;
}
