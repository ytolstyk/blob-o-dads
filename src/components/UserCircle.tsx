/// <reference types="google.maps" />
import { useEffect, useMemo, useRef } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import {
  CIRCLE_FILL_OPACITY,
  CIRCLE_STROKE_OPACITY,
  radiusForZoom,
} from '../constants/map';
import { colorFromId } from '../lib/color';
import { offsetFor } from '../lib/offset';
import type { NearbyUser } from '../hooks/useNearbyUsers';

type Props = {
  user: NearbyUser;
  onClick?: (user: NearbyUser) => void;
};

export function UserCircle({ user, onClick }: Props) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  const { color, position } = useMemo(() => {
    const id = user.userId ?? user.id;
    return {
      color: colorFromId(id),
      position: offsetFor(id, user.lat ?? 0, user.lng ?? 0),
    };
  }, [user.userId, user.id, user.lat, user.lng]);

  // Maintain a single google.maps.Circle synced to zoom.
  useEffect(() => {
    if (!map || !window.google?.maps) return;
    const circle = new google.maps.Circle({
      map,
      center: position,
      radius: radiusForZoom(map.getZoom() ?? 14),
      strokeColor: color,
      strokeOpacity: CIRCLE_STROKE_OPACITY,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: CIRCLE_FILL_OPACITY,
      clickable: true,
    });
    circleRef.current = circle;

    const clickListener = onClick
      ? circle.addListener('click', () => onClick(user))
      : null;
    const zoomListener = map.addListener('zoom_changed', () => {
      circle.setRadius(radiusForZoom(map.getZoom() ?? 14));
    });

    return () => {
      clickListener?.remove();
      zoomListener.remove();
      circle.setMap(null);
      circleRef.current = null;
    };
  }, [map, color, position, user, onClick]);

  if (user.lat == null || user.lng == null) return null;

  return (
    <AdvancedMarker position={position} title={user.name}>
      <div
        style={{
          transform: 'translate(-50%, -50%)',
          fontSize: 12,
          fontWeight: 600,
          color: '#111',
          background: 'rgba(255,255,255,0.85)',
          padding: '2px 6px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {user.name}
      </div>
    </AdvancedMarker>
  );
}
