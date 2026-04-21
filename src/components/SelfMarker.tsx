import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { IconUserFilled } from '@tabler/icons-react';
import type { Coords } from '../hooks/useCurrentLocation';

export function SelfMarker({ coords }: { coords: Coords }) {
  return (
    <AdvancedMarker position={coords} title="You">
      <div
        style={{
          background: 'var(--mantine-color-blue-6)',
          borderRadius: '50%',
          padding: 6,
          border: '2px solid white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          display: 'flex',
        }}
      >
        <IconUserFilled size={18} color="white" />
      </div>
    </AdvancedMarker>
  );
}
