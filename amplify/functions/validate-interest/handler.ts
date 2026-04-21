import type { AppSyncResolverHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/validate-interest';
import type { Schema } from '../../data/resource';
// @ts-expect-error suncalc has no bundled types in this lambda
import SunCalc from 'suncalc';

type Args = { venueId: string; userLat: number; userLng: number };
type Result = { approved: boolean; sessionId?: string; reason?: string };

function haversineMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const handler: AppSyncResolverHandler<Args, Result> = async (event) => {
  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
  Amplify.configure(resourceConfig, libraryOptions);
  const client = generateClient<Schema>();

  const { venueId, userLat, userLng } = event.arguments;

  const { data: venue } = await client.models.Venue.get({ id: venueId });
  if (!venue) return { approved: false, reason: 'Venue not found.' };

  // Geo-fence: user must be within 10 miles of the venue.
  const dist = haversineMiles(userLat, userLng, venue.lat, venue.lng);
  if (dist > 10) {
    return {
      approved: false,
      reason: `You need to be within 10 miles to express interest (you're ~${dist.toFixed(1)} mi away).`,
    };
  }

  // Sun-safety: parks are only safe during daylight.
  if (venue.type === 'PARK') {
    const times = SunCalc.getTimes(new Date(), userLat, userLng) as { sunset: Date };
    if (Date.now() + 60 * 60 * 1000 > times.sunset.getTime()) {
      return {
        approved: false,
        reason: "Parks are closed for meetups after sunset for safety.",
      };
    }
  }

  // Idempotent session creation for today.
  const today = new Date().toLocaleDateString('en-CA');
  const { data: existing } = await client.models.MeetupSession.list({
    filter: {
      and: [{ venueId: { eq: venueId } }, { sessionDate: { eq: today } }],
    },
    limit: 1,
  });

  let sessionId: string;
  if (existing.length > 0) {
    sessionId = existing[0].id;
  } else {
    const { data: created, errors } = await client.models.MeetupSession.create({
      venueId,
      status: 'PENDING',
      quorumCount: 0,
      sessionDate: today,
    });
    if (errors || !created) {
      // Race condition: another lambda created it first — re-query.
      const { data: retry } = await client.models.MeetupSession.list({
        filter: {
          and: [{ venueId: { eq: venueId } }, { sessionDate: { eq: today } }],
        },
        limit: 1,
      });
      if (!retry.length) return { approved: false, reason: 'Session creation failed.' };
      sessionId = retry[0].id;
    } else {
      sessionId = created.id;
    }
  }

  return { approved: true, sessionId };
};
