import { useEffect, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';
import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/dataClient';
import { useMe } from './useMe';

export type Ping = Schema['Ping']['type'];

// Subscribes to pings addressed to the signed-in user. Toasts each new ping
// after the initial snapshot, and tracks a session-local "unread" count for
// the notification bell.
export function usePingInbox(): {
  pings: Ping[];
  unreadCount: number;
  markAllRead: () => void;
} {
  const me = useMe();
  const [pings, setPings] = useState<Ping[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!me.auth) return;
    initialized.current = false;
    seenIds.current = new Set();
    const sub = client.models.Ping.observeQuery({
      filter: { toUserId: { eq: me.auth.userId } },
    }).subscribe({
      next: ({ items }) => {
        const sorted = [...items].sort(
          (a, b) => b.createdAt.localeCompare(a.createdAt),
        );
        setPings(sorted);

        if (!initialized.current) {
          sorted.forEach((p) => seenIds.current.add(p.id));
          initialized.current = true;
          return;
        }

        const fresh = sorted.filter((p) => !seenIds.current.has(p.id));
        if (fresh.length) {
          fresh.forEach((p) => {
            seenIds.current.add(p.id);
            notifications.show({
              color: 'blue',
              title: 'New ping',
              message: 'Someone wants to hang out.',
            });
          });
          setUnreadCount((c) => c + fresh.length);
        }
      },
    });
    return () => sub.unsubscribe();
  }, [me.auth]);

  return {
    pings,
    unreadCount,
    markAllRead: () => setUnreadCount(0),
  };
}
