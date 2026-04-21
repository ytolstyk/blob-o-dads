import { useEffect, useRef, useMemo, useState } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Alert, Box } from '@mantine/core';
import { TopNav } from '../components/TopNav';
import { SelfMarker } from '../components/SelfMarker';
import { VenueCircle } from '../components/VenueCircle';
import { VenueDrawer } from '../components/VenueDrawer';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { useNearbyVenues } from '../hooks/useNearbyVenues';
import { useVenueSessions } from '../hooks/useVenueSessions';
import { useSessionParticipants } from '../hooks/useSessionParticipants';
import { useVenueParticipantCounts } from '../hooks/useVenueParticipantCounts';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants/map';
import type { Venue } from '../hooks/useNearbyVenues';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

function MapCenterer({ coords }: { coords: { lat: number; lng: number } | null }) {
  const map = useMap();
  const centered = useRef(false);
  useEffect(() => {
    if (map && coords && !centered.current) {
      map.panTo(coords);
      centered.current = true;
    }
  }, [map, coords]);
  return null;
}

export default function MapRoute() {
  const { coords, permissionDenied } = useCurrentLocation();
  const { venues } = useNearbyVenues(coords);
  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const venueIds = useMemo(() => venues.map((v) => v.id), [venues]);
  const sessionsByVenueId = useVenueSessions(venueIds, today);

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const selectedSession = selectedVenue ? sessionsByVenueId[selectedVenue.id] : undefined;
  const participants = useSessionParticipants(selectedSession?.id ?? null);

  const participantCounts = useVenueParticipantCounts(sessionsByVenueId);

  if (!API_KEY) {
    return (
      <Box p="md">
        <TopNav />
        <Alert color="yellow" title="Google Maps key missing" mt="md">
          Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env</code> and
          restart <code>npm run dev</code>.
        </Alert>
      </Box>
    );
  }

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100svh' }}>
      <TopNav />
      {permissionDenied && (
        <Alert color="yellow" m="sm" title="Location needed">
          Enable location access in your browser to find venues near you.
        </Alert>
      )}
      <Box style={{ flex: 1, position: 'relative' }}>
        <APIProvider apiKey={API_KEY}>
          <Map
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={DEFAULT_ZOOM}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapId="blob-o-dads-map"
          >
            <MapCenterer coords={coords} />
            {coords && <SelfMarker coords={coords} />}
            {venues.map((venue) => (
              <VenueCircle
                key={venue.id}
                venue={venue}
                session={sessionsByVenueId[venue.id]}
                participantCount={participantCounts[venue.id] ?? 0}
                onVenueClick={setSelectedVenue}
              />
            ))}
          </Map>
        </APIProvider>
      </Box>
      <VenueDrawer
        venue={selectedVenue}
        session={selectedSession}
        participants={participants}
        userCoords={coords}
        onClose={() => setSelectedVenue(null)}
      />
    </Box>
  );
}
