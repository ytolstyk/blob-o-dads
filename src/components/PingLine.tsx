/// <reference types="google.maps" />
import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { LINE_OPACITY, LINE_WEIGHT } from '../constants/map';
import { colorFromId } from '../lib/color';
import { offsetFor } from '../lib/offset';

type Props = {
  fromUserId: string;
  fromCoords: { lat: number; lng: number };
  toUserId: string;
  toCoords: { lat: number; lng: number };
  // Whose color to render the line in (plan: "colored with the target's circle color").
  colorByUserId?: string;
};

// Renders a single polyline between two users on the map. Both endpoints use
// the same deterministic offset the UserCircle uses so the line visually
// terminates on the circle center, not on the real coord.
export function PingLine({
  fromUserId,
  fromCoords,
  toUserId,
  toCoords,
  colorByUserId,
}: Props) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google?.maps) return;
    const color = colorFromId(colorByUserId ?? toUserId);
    const from = offsetFor(fromUserId, fromCoords.lat, fromCoords.lng);
    const to = offsetFor(toUserId, toCoords.lat, toCoords.lng);
    const line = new google.maps.Polyline({
      map,
      path: [from, to],
      strokeColor: color,
      strokeOpacity: LINE_OPACITY,
      strokeWeight: LINE_WEIGHT,
      clickable: false,
    });
    return () => {
      line.setMap(null);
    };
  }, [
    map,
    fromUserId,
    fromCoords.lat,
    fromCoords.lng,
    toUserId,
    toCoords.lat,
    toCoords.lng,
    colorByUserId,
  ]);

  return null;
}
