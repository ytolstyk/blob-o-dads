import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { IconFlag3Filled } from '@tabler/icons-react';
import type { LatLng } from '../lib/centroid';

export function MeetingPlaceMarker({ position }: { position: LatLng }) {
  return (
    <AdvancedMarker position={position} title="Meeting place">
      <div
        style={{
          background: 'var(--mantine-color-red-6)',
          borderRadius: '50%',
          padding: 6,
          border: '2px solid white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          display: 'flex',
          transform: 'translate(-50%, -100%)',
        }}
      >
        <IconFlag3Filled size={18} color="white" />
      </div>
    </AdvancedMarker>
  );
}
