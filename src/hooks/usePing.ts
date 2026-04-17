import { useCallback, useState } from 'react';
import { client } from '../lib/dataClient';
import { useMe } from './useMe';

function defaultGroupName(): string {
  const d = new Date();
  const date = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return `Hangout ${date}`;
}

// Pings another user. Creates a new Group, adds self as the first GroupMember,
// and writes a Ping row addressed to the target. Returns the new group id so the
// caller can navigate to /groups/:id if desired.
export function usePing() {
  const me = useMe();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ping = useCallback(
    async (toUserId: string): Promise<string | null> => {
      if (!me.auth || !me.profile) {
        setError('Not signed in.');
        return null;
      }
      setPending(true);
      setError(null);
      try {
        const now = new Date().toISOString();
        const group = await client.models.Group.create({
          name: defaultGroupName(),
          ownerId: me.auth.userId,
          lastMemberJoinedAt: now,
        });
        if (!group.data) throw new Error('Group create failed');

        const [member, pingRow] = await Promise.all([
          client.models.GroupMember.create({
            groupId: group.data.id,
            userId: me.auth.userId,
            joinedAt: now,
          }),
          client.models.Ping.create({
            fromUserId: me.auth.userId,
            toUserId,
            groupId: group.data.id,
            createdAt: now,
          }),
        ]);
        if (!member.data || !pingRow.data) {
          throw new Error('Ping create failed');
        }
        return group.data.id;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ping failed');
        return null;
      } finally {
        setPending(false);
      }
    },
    [me.auth, me.profile],
  );

  return { ping, pending, error };
}
