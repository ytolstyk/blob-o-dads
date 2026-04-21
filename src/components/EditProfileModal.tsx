import { useState } from 'react';
import { Modal, Stack, TextInput, Group, Button, Alert } from '@mantine/core';
import { client } from '../lib/dataClient';
import type { Me } from '../hooks/useMe';

type Profile = NonNullable<Me['profile']>;

export function EditProfileModal({
  opened,
  onClose,
  profile,
}: {
  opened: boolean;
  onClose: () => void;
  profile: Profile | null;
}) {
  const [name, setName] = useState(profile?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!profile?.id || !name.trim()) {
      setError('Name is required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await client.models.User.update({ id: profile.id, name: name.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Edit profile" size="md">
      <Stack>
        <TextInput
          label="Name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
          disabled={busy}
        />
        {error && <Alert color="red">{error}</Alert>}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} loading={busy} disabled={!name.trim()}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
