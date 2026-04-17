import { useEffect, useMemo, useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/dataClient';
import { useMyGroups } from './useMyGroups';

export type GroupRow = Schema['Group']['type'];

// Returns the "current" group for overlay purposes: the group whose member row
// for the signed-in user was most recently joined. Null if not in any group.
export function useActiveGroup(): GroupRow | null {
  const { memberships } = useMyGroups();
  const [groups, setGroups] = useState<Record<string, GroupRow>>({});

  const latestGroupId = useMemo(() => {
    if (!memberships.length) return null;
    const sorted = [...memberships].sort((a, b) =>
      b.joinedAt.localeCompare(a.joinedAt),
    );
    return sorted[0].groupId;
  }, [memberships]);

  useEffect(() => {
    if (!latestGroupId) return;
    if (groups[latestGroupId]) return;
    let cancelled = false;
    (async () => {
      const res = await client.models.Group.get({ id: latestGroupId });
      if (cancelled || !res.data) return;
      setGroups((prev) => ({ ...prev, [latestGroupId]: res.data! }));
    })();
    return () => {
      cancelled = true;
    };
  }, [latestGroupId, groups]);

  return latestGroupId ? groups[latestGroupId] ?? null : null;
}
