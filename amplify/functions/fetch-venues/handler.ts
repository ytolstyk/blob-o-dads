import type { AppSyncResolverHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend-function/runtime';
import { env } from '$amplify/env/fetch-venues';
import type { Schema } from '../../data/resource.js';

type Args = { lat: number; lng: number };
type Result = string[];

const CACHE_TTL_MS = 15 * 60 * 1000;
const SEARCH_RADIUS_M = 16_000;

// Google Places API v1 place types mapped to our VenueType enum.
const TYPE_MAP: Array<{ googleType: string; venueType: 'PARK' | 'CAFE' | 'MALL' | 'LIBRARY' }> = [
  { googleType: 'park', venueType: 'PARK' },
  { googleType: 'cafe', venueType: 'CAFE' },
  { googleType: 'shopping_mall', venueType: 'MALL' },
  { googleType: 'library', venueType: 'LIBRARY' },
];

type Period = { close?: { day: number; hour: number; minute: number } };

type Place = {
  id: string;
  displayName?: { text: string };
  location?: { latitude: number; longitude: number };
  regularOpeningHours?: { openNow: boolean; periods?: Period[] };
};

interface PlacesResult {
  places?: Place[];
}

function closingTimeMs(periods: Period[] | undefined): number | null {
  if (!periods) return null;
  const now = new Date();
  const dayOfWeek = now.getDay();
  const todayPeriod = periods.find((p) => p.close?.day === dayOfWeek);
  if (!todayPeriod?.close) return null;
  const closeMs = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    todayPeriod.close.hour,
    todayPeriod.close.minute,
  ).getTime();
  return closeMs;
}

export const handler: AppSyncResolverHandler<Args, Result> = async (event) => {
  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as Parameters<typeof getAmplifyDataClientConfig>[0]);
  Amplify.configure(resourceConfig, libraryOptions);
  const client = generateClient<Schema>();

  const { lat, lng } = event.arguments;
  const apiKey = env.GOOGLE_PLACES_API_KEY ?? '';
  const venueIds: string[] = [];
  const now = Date.now();

  for (const { googleType, venueType } of TYPE_MAP) {
    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.location,places.regularOpeningHours',
      },
      body: JSON.stringify({
        includedTypes: [googleType],
        maxResultCount: 20,
        locationRestriction: {
          circle: { center: { latitude: lat, longitude: lng }, radius: SEARCH_RADIUS_M },
        },
      }),
    });

    const data: PlacesResult = (await res.json()) as PlacesResult;
    if (!data.places) continue;

    for (const place of data.places) {
      if (!place.regularOpeningHours?.openNow) continue;
      const closing = closingTimeMs(place.regularOpeningHours.periods);
      // Must be open for at least 1 more hour.
      if (closing !== null && closing < now + 60 * 60 * 1000) continue;

      const googlePlaceId = place.id;
      const venueName = place.displayName?.text ?? 'Unknown venue';
      const venueLat = place.location?.latitude ?? 0;
      const venueLng = place.location?.longitude ?? 0;

      // Check cache freshness by querying existing Venue row.
      const { data: existing } = await client.models.Venue.list({
        filter: { googlePlaceId: { eq: googlePlaceId } },
        limit: 1,
      });

      if (existing.length > 0) {
        const v = existing[0];
        const updatedAt = v.venueUpdatedAt ? new Date(v.venueUpdatedAt).getTime() : 0;
        if (now - updatedAt < CACHE_TTL_MS) {
          venueIds.push(v.id);
          continue;
        }
        // Stale — update coordinates and timestamp.
        await client.models.Venue.update({
          id: v.id,
          lat: venueLat,
          lng: venueLng,
          venueUpdatedAt: new Date().toISOString(),
        });
        venueIds.push(v.id);
      } else {
        const { data: created } = await client.models.Venue.create({
          name: venueName,
          type: venueType,
          lat: venueLat,
          lng: venueLng,
          googlePlaceId,
          venueUpdatedAt: new Date().toISOString(),
        });
        if (created) venueIds.push((created as { id: string }).id);
      }
    }
  }

  return venueIds;
};
