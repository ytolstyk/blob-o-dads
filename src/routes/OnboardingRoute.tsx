import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Stack,
  Title,
  Text,
  TextInput,
  Select,
  Chip,
  Group,
  Button,
  Alert,
  Center,
  Paper,
  Divider,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useMe } from '../hooks/useMe';
import { client } from '../lib/dataClient';
import { AGE_RANGE_OPTIONS, type AgeRangeValue } from '../constants/ageRanges';
import { DAY_OPTIONS, type DayValue } from '../constants/days';

export default function OnboardingRoute() {
  const navigate = useNavigate();
  const me = useMe();

  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState<AgeRangeValue | null>(null);
  const [days, setDays] = useState<DayValue[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [geoGranted, setGeoGranted] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestGeo() {
    setError(null);
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not available in this browser.');
      setGeoGranted(false);
      return;
    }
    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setGeoGranted(true);
          resolve();
        },
        (e) => {
          setError(`Location denied: ${e.message}`);
          setGeoGranted(false);
          resolve();
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
      );
    });
  }

  async function submit() {
    if (!me.auth || !ageRange || !name.trim()) {
      setError('Name and age range are required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const input: Parameters<typeof client.models.User.create>[0] = {
        userId: me.auth.userId,
        name: name.trim(),
        ageRange,
        availabilityDays: days.length ? days : null,
        availabilityStart: startTime || null,
        availabilityEnd: endTime || null,
        onboardedAt: new Date().toISOString(),
      };
      await client.models.User.create(input);
      navigate('/map', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Center mih="100svh" p="md">
      <Paper withBorder p="xl" radius="md" w={520} maw="100%">
        <Stack>
          <Title order={2}>Tell us about you</Title>
          <TextInput
            label="Name"
            placeholder="What should people see on the map?"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
            disabled={busy}
          />
          <Select
            label="Age range"
            description="Pick the range that fits best. They overlap on purpose."
            placeholder="Choose a range"
            data={AGE_RANGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={ageRange}
            onChange={(v) => setAgeRange(v as AgeRangeValue | null)}
            required
            disabled={busy}
          />

          <Divider label="Availability (optional)" labelPosition="left" />
          <Text size="sm" c="dimmed">
            When are you generally open to hang out?
          </Text>
          <Chip.Group multiple value={days} onChange={(v) => setDays(v as DayValue[])}>
            <Group gap="xs">
              {DAY_OPTIONS.map((d) => (
                <Chip key={d.value} value={d.value} disabled={busy}>
                  {d.label}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
          <Group grow>
            <TimeInput
              label="From"
              value={startTime}
              onChange={(e) => setStartTime(e.currentTarget.value)}
              disabled={busy}
            />
            <TimeInput
              label="To"
              value={endTime}
              onChange={(e) => setEndTime(e.currentTarget.value)}
              disabled={busy}
            />
          </Group>

          <Divider label="Location" labelPosition="left" />
          <Text size="sm" c="dimmed">
            Blob-o-dads needs your location to show who's around you. We never
            use it outside the app and your exact spot is obfuscated — others
            see a fuzzy circle, not a pin.
          </Text>
          <Button
            variant={geoGranted ? 'light' : 'filled'}
            color={geoGranted ? 'teal' : 'blue'}
            onClick={requestGeo}
            disabled={busy}
          >
            {geoGranted ? 'Location granted ✓' : 'Allow location'}
          </Button>

          {error && <Alert color="red">{error}</Alert>}

          <Button
            onClick={submit}
            loading={busy}
            disabled={!name.trim() || !ageRange || geoGranted !== true}
            fullWidth
          >
            Get started
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
