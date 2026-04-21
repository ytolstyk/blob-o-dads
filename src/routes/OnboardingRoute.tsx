import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Stack,
  Title,
  TextInput,
  Group,
  Button,
  Alert,
  Center,
  Paper,
} from '@mantine/core';
import { signOut } from 'aws-amplify/auth';
import { useMe } from '../hooks/useMe';
import { client } from '../lib/dataClient';

export default function OnboardingRoute() {
  const navigate = useNavigate();
  const me = useMe();

  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!me.auth || !name.trim()) {
      setError('Name is required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await client.models.User.create({
        userId: me.auth.userId,
        name: name.trim(),
        onboardedAt: new Date().toISOString(),
      });
      navigate('/map', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Center mih="100svh" p="md">
      <Paper withBorder p="xl" radius="md" w={420} maw="100%">
        <Stack>
          <Group justify="space-between" align="center">
            <Title order={2}>What's your name?</Title>
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
            placeholder="What should others see at the venue?"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
            autoFocus
            disabled={busy}
          />
          {error && <Alert color="red">{error}</Alert>}
          <Button
            onClick={submit}
            loading={busy}
            disabled={!name.trim()}
            fullWidth
          >
            Get started
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
