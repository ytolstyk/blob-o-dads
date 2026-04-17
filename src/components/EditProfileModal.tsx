import { useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Select,
  Chip,
  Group,
  Button,
  Alert,
  Divider,
  Text,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { client } from '../lib/dataClient';
import { AGE_RANGE_OPTIONS, type AgeRangeValue } from '../constants/ageRanges';
import { DAY_OPTIONS, type DayValue } from '../constants/days';
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
  const [ageRange, setAgeRange] = useState<AgeRangeValue | null>(
    (profile?.ageRange as AgeRangeValue) ?? null,
  );
  const [days, setDays] = useState<DayValue[]>(
    (profile?.availabilityDays?.filter(Boolean) as DayValue[]) ?? [],
  );
  const [startTime, setStartTime] = useState(profile?.availabilityStart ?? '');
  const [endTime, setEndTime] = useState(profile?.availabilityEnd ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!profile?.id || !ageRange || !name.trim()) {
      setError('Name and age range are required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await client.models.User.update({
        id: profile.id,
        name: name.trim(),
        ageRange,
        availabilityDays: days.length ? days : null,
        availabilityStart: startTime || null,
        availabilityEnd: endTime || null,
      });
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
        <Select
          label="Age range"
          data={AGE_RANGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={ageRange}
          onChange={(v) => setAgeRange(v as AgeRangeValue | null)}
          required
          disabled={busy}
        />
        <Divider label="Availability" labelPosition="left" />
        <Text size="xs" c="dimmed">
          Days and hours you're generally free.
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
        {error && <Alert color="red">{error}</Alert>}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} loading={busy}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
