import { useMemo, useState } from 'react';
import {
  Drawer,
  Stack,
  Text,
  Badge,
  Button,
  Alert,
  Group,
  Progress,
  Divider,
  ThemeIcon,
} from '@mantine/core';
import { IconMapPin, IconUsers, IconClock, IconCheck } from '@tabler/icons-react';
import { VENUE_COLORS } from '../constants/map';
import { haversineMiles } from '../lib/distance';
import { useExpressInterest } from '../hooks/useExpressInterest';
import { useVoteSlot } from '../hooks/useVoteSlot';
import { useMe } from '../hooks/useMe';
import type { Venue } from '../hooks/useNearbyVenues';
import type { MeetupSession } from '../hooks/useVenueSessions';
import type { DadInSession } from '../hooks/useSessionParticipants';
import type { Coords } from '../hooks/useCurrentLocation';

const QUORUM = 3;

type Props = {
  venue: Venue | null;
  session?: MeetupSession;
  participants: DadInSession[];
  userCoords: Coords | null;
  onClose: () => void;
};

function slotLabel(sessionCreatedAt: string, slotIndex: 1 | 2 | 3): string {
  const base = new Date(sessionCreatedAt).getTime();
  const minutes = slotIndex * 15;
  const time = new Date(base + minutes * 60 * 1000);
  return `+${minutes} min (${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
}

export function VenueDrawer({ venue, session, participants, userCoords, onClose }: Props) {
  const me = useMe();
  const { expressInterest, withdrawInterest, pending } = useExpressInterest();
  const { vote, pending: votePending } = useVoteSlot();
  const [interestError, setInterestError] = useState<string | null>(null);

  const myParticipation = useMemo(
    () => participants.find((p) => p.userId === me.auth?.userId),
    [participants, me.auth?.userId],
  );

  const isParticipating = !!myParticipation;
  const count = participants.length;
  const isActive = session?.status === 'ACTIVE';
  const isExpired = session?.status === 'EXPIRED';

  const voteCounts = useMemo(() => {
    const counts = [0, 0, 0];
    for (const p of participants) {
      if (p.voteSlot && p.voteSlot >= 1 && p.voteSlot <= 3) {
        counts[p.voteSlot - 1]++;
      }
    }
    return counts;
  }, [participants]);

  const distance = useMemo(() => {
    if (!userCoords || !venue) return null;
    const d = haversineMiles(userCoords, { lat: venue.lat, lng: venue.lng });
    return d < 0.1 ? 'less than 0.1 mi' : `~${d.toFixed(1)} mi`;
  }, [userCoords, venue]);

  const typeColor = venue ? (VENUE_COLORS[venue.type] ?? '#888') : '#888';

  async function handleInterest() {
    if (!venue || !userCoords) return;
    setInterestError(null);
    const res = await expressInterest(venue.id, userCoords);
    if (!res.ok) setInterestError(res.error ?? 'Something went wrong.');
  }

  async function handleWithdraw() {
    if (!myParticipation) return;
    await withdrawInterest(myParticipation.id);
  }

  async function handleVote(slot: 1 | 2 | 3) {
    if (!myParticipation) return;
    await vote(myParticipation.id, slot);
  }

  return (
    <Drawer
      opened={!!venue}
      onClose={onClose}
      position="right"
      size="sm"
      title={venue?.name ?? ''}
    >
      {venue && (
        <Stack gap="md">
          <Group gap="xs">
            <Badge
              style={{ background: typeColor, color: '#fff' }}
              variant="filled"
            >
              {venue.type}
            </Badge>
            {distance && (
              <Badge variant="light" color="gray" leftSection={<IconMapPin size={12} />}>
                {distance}
              </Badge>
            )}
          </Group>

          {isExpired ? (
            <Alert color="gray" icon={<IconClock size={16} />}>
              This session has ended. Check back tomorrow!
            </Alert>
          ) : isActive ? (
            <>
              <Alert color="yellow" title="Quorum met! Vote for a time." variant="light">
                <IconUsers size={14} /> {count} dads are in — pick a meeting time:
              </Alert>
              <Stack gap="xs">
                {([1, 2, 3] as const).map((slot) => (
                  <Button
                    key={slot}
                    variant={myParticipation?.voteSlot === slot ? 'filled' : 'light'}
                    color="yellow"
                    leftSection={myParticipation?.voteSlot === slot ? <IconCheck size={14} /> : undefined}
                    rightSection={
                      <Text size="xs" c="dimmed">
                        {voteCounts[slot - 1]} vote{voteCounts[slot - 1] !== 1 ? 's' : ''}
                      </Text>
                    }
                    onClick={() => handleVote(slot)}
                    loading={votePending}
                    disabled={!isParticipating}
                    fullWidth
                  >
                    {slotLabel(session!.createdAt, slot)}
                  </Button>
                ))}
              </Stack>
              <Divider />
              {isParticipating && (
                <Button variant="subtle" color="red" size="xs" onClick={handleWithdraw}>
                  I can't make it — withdraw
                </Button>
              )}
            </>
          ) : (
            <>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={600}>
                    <IconUsers size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {count} / {QUORUM} dads interested
                  </Text>
                  {isParticipating && (
                    <ThemeIcon color="teal" size="sm" variant="light">
                      <IconCheck size={12} />
                    </ThemeIcon>
                  )}
                </Group>
                <Progress
                  value={(count / QUORUM) * 100}
                  color={typeColor}
                  size="sm"
                  radius="xl"
                  animated={count > 0 && count < QUORUM}
                />
                <Text size="xs" c="dimmed">
                  {QUORUM - count > 0
                    ? `${QUORUM - count} more needed to confirm a meetup`
                    : 'Quorum reached!'}
                </Text>
              </Stack>

              {interestError && (
                <Alert color="red" title="Can't join" onClose={() => setInterestError(null)} withCloseButton>
                  {interestError}
                </Alert>
              )}

              {!isParticipating ? (
                <Button
                  onClick={handleInterest}
                  loading={pending}
                  disabled={!userCoords}
                  fullWidth
                >
                  I'm interested in meeting here
                </Button>
              ) : (
                <Stack gap="xs">
                  <Alert color="teal" variant="light">
                    You're in! Waiting for {QUORUM - count} more dad{QUORUM - count !== 1 ? 's' : ''}…
                  </Alert>
                  <Button variant="subtle" color="red" size="xs" onClick={handleWithdraw}>
                    Withdraw interest
                  </Button>
                </Stack>
              )}
            </>
          )}
        </Stack>
      )}
    </Drawer>
  );
}
