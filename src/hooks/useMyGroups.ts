import { useEffect, useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/dataClient';
import { useMe } from './useMe';

export type Membership = Schema['GroupMember']['type'];

// Subscribes to the signed-in user's GroupMember rows so we can know which
// groupIds they belong to (for filtering pings already joined, etc.).
export function useMyGroups(): {
  memberships: Membership[];
  groupIds: Set<string>;
} {
  const me = useMe();
  const [memberships, setMemberships] = useState<Membership[]>([]);

  useEffect(() => {
    if (!me.auth) return;
    const sub = client.models.GroupMember.observeQuery({
      filter: { userId: { eq: me.auth.userId } },
    }).subscribe({
      next: ({ items }) => setMemberships(items),
    });
    return () => sub.unsubscribe();
  }, [me.auth]);

  return {
    memberships,
    groupIds: new Set(memberships.map((m) => m.groupId)),
  };
}
