import type { EventBridgeHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend-function/runtime';
import { env } from '$amplify/env/cleanup-sessions';
import type { Schema } from '../../data/resource';

const PENDING_TTL_MS = 3 * 60 * 60 * 1000;
const ACTIVE_GRACE_MS = 2 * 60 * 60 * 1000;

export const handler: EventBridgeHandler<'Scheduled Event', unknown, void> = async () => {
  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
  Amplify.configure(resourceConfig, libraryOptions);
  const client = generateClient<Schema>();

  const today = new Date().toLocaleDateString('en-CA');
  const { data: sessions } = await client.models.MeetupSession.list({
    filter: {
      and: [{ sessionDate: { eq: today } }, { status: { ne: 'EXPIRED' } }],
    },
  });

  const now = Date.now();
  await Promise.all(
    sessions.map(async (s) => {
      const created = new Date(s.createdAt).getTime();
      if (s.status === 'PENDING' && now - created > PENDING_TTL_MS) {
        await client.models.MeetupSession.update({ id: s.id, status: 'EXPIRED' });
        return;
      }
      if (s.status === 'ACTIVE' && s.targetTime) {
        const target = new Date(s.targetTime).getTime();
        if (now - target > ACTIVE_GRACE_MS) {
          await client.models.MeetupSession.update({ id: s.id, status: 'EXPIRED' });
        }
      }
    }),
  );
};
