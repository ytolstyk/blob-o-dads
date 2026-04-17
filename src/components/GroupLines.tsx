/// <reference types="google.maps" />
import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { LINE_OPACITY, LINE_WEIGHT } from '../constants/map';
import { colorFromId } from '../lib/color';
import { offsetFor } from '../lib/offset';

type MemberCoord = { userId: string; lat: number; lng: number };

type Props = {
  selfUserId: string;
  selfCoords: { lat: number; lng: number };
  members: MemberCoord[];
};

// Draws one polyline from self to each other group member, colored by the
// other member's id so each line matches that member's circle color.
export function GroupLines({ selfUserId, selfCoords, members }: Props) {
  const map = useMap();
  const { lat: selfLat, lng: selfLng } = selfCoords;
  // Stringify for stable deps on the members list.
  const membersKey = members
    .map((m) => `${m.userId}:${m.lat}:${m.lng}`)
    .sort()
    .join(',');

  useEffect(() => {
    if (!map || !window.google?.maps) return;
    const lines = members
      .filter((m) => m.userId !== selfUserId)
      .map((m) =>
        new google.maps.Polyline({
          map,
          path: [{ lat: selfLat, lng: selfLng }, offsetFor(m.userId, m.lat, m.lng)],
          strokeColor: colorFromId(m.userId),
          strokeOpacity: LINE_OPACITY,
          strokeWeight: LINE_WEIGHT,
          clickable: false,
        }),
      );
    return () => {
      for (const l of lines) l.setMap(null);
    };
  }, [map, selfUserId, selfLat, selfLng, membersKey, members]);

  return null;
}
