import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { IconArrowUp } from '@tabler/icons-react';
import { bearingDegrees, type LatLng } from '../lib/centroid';

type Props = {
  selfCoords: LatLng;
  meetingPlace: LatLng;
};

// Renders a small arrow anchored on the user's self marker that rotates to
// always point at the group's meeting place.
export function MeetingPlaceArrow({ selfCoords, meetingPlace }: Props) {
  const deg = bearingDegrees(selfCoords, meetingPlace);
  return (
    <AdvancedMarker position={selfCoords} title="Meeting place is this way">
      <div
        style={{
          // Float the arrow above and to the right of the self marker.
          transform: `translate(6px, -36px) rotate(${deg}deg)`,
          background: 'var(--mantine-color-red-6)',
          borderRadius: '50%',
          padding: 4,
          border: '2px solid white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          display: 'flex',
          pointerEvents: 'none',
        }}
      >
        <IconArrowUp size={14} color="white" />
      </div>
    </AdvancedMarker>
  );
}
