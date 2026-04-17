import { useCallback, useState } from 'react';
import { client } from '../lib/dataClient';
import { useMe } from './useMe';

// Adds the signed-in user to an existing Group by creating a GroupMember row
// and bumping the group's lastMemberJoinedAt. Returns true on success.
export function useJoinGroup() {
  const me = useMe();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!me.auth) {
        setError('Not signed in.');
        return false;
      }
      setPending(true);
      setError(null);
      try {
        const now = new Date().toISOString();
        const member = await client.models.GroupMember.create({
          groupId,
          userId: me.auth.userId,
          joinedAt: now,
        });
        if (!member.data) throw new Error('Join failed');
        await client.models.Group.update({
          id: groupId,
          lastMemberJoinedAt: now,
        });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Join failed');
        return false;
      } finally {
        setPending(false);
      }
    },
    [me.auth],
  );

  return { join, pending, error };
}
