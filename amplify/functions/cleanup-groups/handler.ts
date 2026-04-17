import type { EventBridgeHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/cleanup-groups';
import type { Schema } from '../../data/resource';

const SOLO_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export const handler: EventBridgeHandler<'Scheduled Event', unknown, void> =
  async () => {
    const { resourceConfig, libraryOptions } =
      await getAmplifyDataClientConfig(env);
    Amplify.configure(resourceConfig, libraryOptions);
    const client = generateClient<Schema>();

    const { data: groups } = await client.models.Group.list();
    const now = Date.now();

    await Promise.all(
      groups.map(async (g) => {
        const { data: members } = await client.models.GroupMember.list({
          filter: { groupId: { eq: g.id } },
        });

        if (members.length === 0) {
          await client.models.Group.delete({ id: g.id });
          return;
        }

        if (members.length === 1) {
          const m = members[0];
          const joinedAt = new Date(m.joinedAt).getTime();
          if (now - joinedAt > SOLO_MAX_AGE_MS) {
            await client.models.GroupMember.delete({ id: m.id });
            await client.models.Group.delete({ id: g.id });
          }
        }
      }),
    );
  };
