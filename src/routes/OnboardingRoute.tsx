import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Stack,
  Title,
  Text,
  TextInput,
  Select,
  Group,
  Button,
  Alert,
  Center,
  Paper,
  Divider,
} from '@mantine/core';
import { signOut } from 'aws-amplify/auth';
import { useMe } from '../hooks/useMe';
import { client } from '../lib/dataClient';
import { AGE_RANGE_OPTIONS, type AgeRangeValue } from '../constants/ageRanges';

export default function OnboardingRoute() {
  const navigate = useNavigate();
  const me = useMe();

  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState<AgeRangeValue | null>(null);
  const [geoGranted, setGeoGranted] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!('permissions' in navigator)) return;
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') setGeoGranted(true);
    });
  }, []);

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
          <Group justify="space-between" align="center">
            <Title order={2}>Tell us about you</Title>
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => signOut().then(() => navigate('/login', { replace: true }))}
              disabled={busy}
            >
              Log out
            </Button>
          </Group>
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
