import { useEffect, useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/dataClient';

export type GroupMember = Schema['GroupMember']['type'];
export type UserRow = Schema['User']['type'];

// Subscribes to the members of a single group. Returns the membership rows.
export function useGroupMembers(groupId: string | null): GroupMember[] {
  const [members, setMembers] = useState<GroupMember[]>([]);

  useEffect(() => {
    if (!groupId) return;
    const sub = client.models.GroupMember.observeQuery({
      filter: { groupId: { eq: groupId } },
    }).subscribe({
      next: ({ items }) => setMembers(items),
    });
    return () => sub.unsubscribe();
  }, [groupId]);

  return members;
}

// Fetches User rows by userId for the given ids. Re-fetches when the set changes.
// Returns a map: userId → User row.
export function useUsersByIds(userIds: string[]): Record<string, UserRow> {
  const [map, setMap] = useState<Record<string, UserRow>>({});
  const key = [...userIds].sort().join(',');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (userIds.length === 0) {
        if (!cancelled) setMap({});
        return;
      }
      const res = await client.models.User.list({
        filter: { or: userIds.map((id) => ({ userId: { eq: id } })) },
      });
      if (cancelled) return;
      const next: Record<string, UserRow> = {};
      for (const u of res.data) if (u.userId) next[u.userId] = u;
      setMap(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return map;
}
