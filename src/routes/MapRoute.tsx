import { useMemo, useState } from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { Alert, Box } from '@mantine/core';
import { TopNav } from '../components/TopNav';
import { SelfMarker } from '../components/SelfMarker';
import { UserCircle } from '../components/UserCircle';
import { UserDrawer } from '../components/UserDrawer';
import { PingLine } from '../components/PingLine';
import { GroupLines } from '../components/GroupLines';
import { MeetingPlaceMarker } from '../components/MeetingPlaceMarker';
import { MeetingPlaceArrow } from '../components/MeetingPlaceArrow';
import { useLocationPolling } from '../hooks/useLocationPolling';
import { useMe } from '../hooks/useMe';
import { useNearbyUsers, type NearbyUser } from '../hooks/useNearbyUsers';
import { useMyGroups } from '../hooks/useMyGroups';
import { useOutgoingPings } from '../hooks/useOutgoingPings';
import { usePingInbox, type Ping } from '../hooks/usePingInbox';
import { useActiveGroup } from '../hooks/useActiveGroup';
import { useGroupMembers, useUsersByIds } from '../hooks/useGroupMembers';
import { centroid } from '../lib/centroid';
import { offsetFor } from '../lib/offset';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants/map';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

export default function MapRoute() {
  const { coords, permissionDenied } = useLocationPolling();
  const me = useMe();
  const nearby = useNearbyUsers(coords, me.auth?.userId ?? null);
  const { groupIds } = useMyGroups();
  const outgoing = useOutgoingPings();
  const { pings: incoming } = usePingInbox();

  const activeGroup = useActiveGroup();
  const activeMembers = useGroupMembers(activeGroup?.id ?? null);
  const activeMemberUserIds = useMemo(
    () => activeMembers.map((m) => m.userId),
    [activeMembers],
  );
  const groupUsers = useUsersByIds(activeMemberUserIds);

  const [selected, setSelected] = useState<NearbyUser | null>(null);
  const [joinGroupId, setJoinGroupId] = useState<string | null>(null);

  const nearbyById = useMemo(() => {
    const m: Record<string, NearbyUser> = {};
    for (const u of nearby) if (u.userId) m[u.userId] = u;
    return m;
  }, [nearby]);

  // Group overlay: lines from self to each member, meeting-place at centroid
  // of member positions (guard to ≥ 2 per spec).
  const groupMemberCoords = useMemo(
    () =>
      activeMembers
        .map((m) => {
          const u = groupUsers[m.userId];
          if (!u || u.lat == null || u.lng == null) return null;
          return { userId: m.userId, lat: u.lat, lng: u.lng };
        })
        .filter((x): x is { userId: string; lat: number; lng: number } => !!x),
    [activeMembers, groupUsers],
  );

  const meetingPlace = useMemo(() => {
    if (groupMemberCoords.length < 2) return null;
    return centroid(
      groupMemberCoords.map((m) => offsetFor(m.userId, m.lat, m.lng)),
    );
  }, [groupMemberCoords]);

  const handleSelectPing = (ping: Ping) => {
    const pinger = nearbyById[ping.fromUserId];
    if (!pinger) return;
    setSelected(pinger);
    setJoinGroupId(ping.groupId);
  };

  const closeDrawer = () => {
    setSelected(null);
    setJoinGroupId(null);
  };

  if (!API_KEY) {
    return (
      <Box p="md">
        <TopNav onSelectPing={handleSelectPing} />
        <Alert color="yellow" title="Google Maps key missing" mt="md">
          Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env</code> and
          restart <code>npm run dev</code>.
        </Alert>
      </Box>
    );
  }

  const center = coords ?? DEFAULT_CENTER;

  // Outgoing ping lines: I'm the sender; draw to the target if nearby + not yet joined by me.
  const outgoingLines = outgoing
    .filter((p) => !groupIds.has(p.groupId))
    .map((p) => ({ ping: p, other: nearbyById[p.toUserId] }))
    .filter((x): x is { ping: Ping; other: NearbyUser } => !!x.other);

  // Incoming ping lines: someone pinged me; draw to the sender if nearby + not yet joined.
  const incomingLines = incoming
    .filter((p) => !groupIds.has(p.groupId))
    .map((p) => ({ ping: p, other: nearbyById[p.fromUserId] }))
    .filter((x): x is { ping: Ping; other: NearbyUser } => !!x.other);

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100svh' }}>
      <TopNav onSelectPing={handleSelectPing} />
      {permissionDenied && (
        <Alert color="yellow" m="sm" title="Location access blocked">
          We can't show who's around until you enable it in your browser
          settings.{' '}
          <Box
            component="span"
            onClick={() => window.location.reload()}
            style={{
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retry permission
          </Box>
        </Alert>
      )}
      <Box style={{ flex: 1, position: 'relative' }}>
        <APIProvider apiKey={API_KEY}>
          <Map
            defaultCenter={center}
            defaultZoom={DEFAULT_ZOOM}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapId="blob-o-dads-map"
          >
            {coords && <SelfMarker coords={coords} />}
            {nearby.map((u) => (
              <UserCircle key={u.id} user={u} onClick={setSelected} />
            ))}
            {coords &&
              me.auth &&
              outgoingLines.map(({ ping, other }) => (
                <PingLine
                  key={ping.id}
                  fromUserId={me.auth!.userId}
                  fromCoords={coords}
                  toUserId={other.userId!}
                  toCoords={{ lat: other.lat!, lng: other.lng! }}
                  colorByUserId={other.userId!}
                />
              ))}
            {coords &&
              me.auth &&
              incomingLines.map(({ ping, other }) => (
                <PingLine
                  key={ping.id}
                  fromUserId={me.auth!.userId}
                  fromCoords={coords}
                  toUserId={other.userId!}
                  toCoords={{ lat: other.lat!, lng: other.lng! }}
                  colorByUserId={other.userId!}
                />
              ))}
            {coords && me.auth && groupMemberCoords.length >= 2 && (
              <GroupLines
                selfUserId={me.auth.userId}
                selfCoords={coords}
                members={groupMemberCoords}
              />
            )}
            {meetingPlace && <MeetingPlaceMarker position={meetingPlace} />}
            {meetingPlace && coords && (
              <MeetingPlaceArrow
                selfCoords={coords}
                meetingPlace={meetingPlace}
              />
            )}
          </Map>
        </APIProvider>
      </Box>
      <UserDrawer
        user={selected}
        onClose={closeDrawer}
        joinGroupId={joinGroupId}
      />
    </Box>
  );
}
