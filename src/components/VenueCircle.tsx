/// <reference types="google.maps" />
import { useEffect, useMemo, useRef } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { VENUE_COLORS, venueOpacity, VENUE_CIRCLE_RADIUS_M, CIRCLE_STROKE_OPACITY } from '../constants/map';
import type { Venue } from '../hooks/useNearbyVenues';
import type { MeetupSession } from '../hooks/useVenueSessions';

const ACTIVE_COLOR = '#FFD700';
const QUORUM = 3;

type Props = {
  venue: Venue;
  session?: MeetupSession;
  participantCount: number;
  onVenueClick: (venue: Venue) => void;
};

export function VenueCircle({ venue, session, participantCount, onVenueClick }: Props) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);
  const isActive = session?.status === 'ACTIVE';

  const { color, fillOpacity, position } = useMemo(() => ({
    color: isActive ? ACTIVE_COLOR : (VENUE_COLORS[venue.type] ?? '#888'),
    fillOpacity: venueOpacity(participantCount, isActive),
    position: { lat: venue.lat, lng: venue.lng },
  }), [venue.type, venue.lat, venue.lng, participantCount, isActive]);

  useEffect(() => {
    if (!map || !window.google?.maps) return;
    const circle = new google.maps.Circle({
      map,
      center: position,
      radius: VENUE_CIRCLE_RADIUS_M,
      strokeColor: color,
      strokeOpacity: CIRCLE_STROKE_OPACITY,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity,
      clickable: true,
    });
    circleRef.current = circle;

    const clickListener = circle.addListener('click', () => onVenueClick(venue));

    return () => {
      clickListener.remove();
      circle.setMap(null);
      circleRef.current = null;
    };
  }, [map, color, fillOpacity, position, venue, onVenueClick]);

  // Update fill opacity reactively without recreating the circle.
  useEffect(() => {
    circleRef.current?.setOptions({ fillOpacity, fillColor: color, strokeColor: color });
  }, [fillOpacity, color]);

  const showBadge = session && session.status !== 'EXPIRED';

  return (
    <AdvancedMarker position={position} title={venue.name}>
      <div
        style={{
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      >
        {showBadge && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: isActive ? '#000' : '#333',
              background: isActive ? ACTIVE_COLOR : 'rgba(255,255,255,0.9)',
              padding: '2px 5px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              border: '1px solid rgba(0,0,0,0.15)',
            }}
          >
            {participantCount}/{QUORUM}
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
}
