import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
  Avatar,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconLogout, IconTrash } from '@tabler/icons-react';
import { TopNav } from '../components/TopNav';
import { client } from '../lib/dataClient';
import { colorFromId } from '../lib/color';
import { useMe } from '../hooks/useMe';
import {
  useGroupMembers,
  useUsersByIds,
  type GroupMember,
} from '../hooks/useGroupMembers';
import type { Schema } from '../../amplify/data/resource';

type GroupRow = Schema['Group']['type'];

export default function GroupRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const me = useMe();
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [renameValue, setRenameValue] = useState('');
  const [saving, setSaving] = useState(false);

  const members = useGroupMembers(id ?? null);
  const userIds = useMemo(() => members.map((m) => m.userId), [members]);
  const usersById = useUsersByIds(userIds);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const res = await client.models.Group.get({ id });
      if (cancelled) return;
      setGroup(res.data ?? null);
      setRenameValue(res.data?.name ?? '');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <Box p="md">
        <TopNav />
        <Group justify="center" mt="xl">
          <Loader />
        </Group>
      </Box>
    );
  }

  if (!group || !id) {
    return (
      <Box p="md">
        <TopNav />
        <Alert color="red" title="Group not found" mt="md">
          It may have been deleted.
          <Box mt="sm">
            <Button onClick={() => navigate('/map')}>Back to map</Button>
          </Box>
        </Alert>
      </Box>
    );
  }

  const isOwner = group.ownerId === me.auth?.userId;
  const myMembership = members.find((m) => m.userId === me.auth?.userId);

  const handleRename = async () => {
    if (!renameValue.trim() || renameValue === group.name) return;
    setSaving(true);
    try {
      const res = await client.models.Group.update({
        id: group.id,
        name: renameValue.trim(),
      });
      if (res.data) setGroup(res.data);
      notifications.show({ color: 'teal', message: 'Renamed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = async (membership: GroupMember) => {
    setSaving(true);
    try {
      await client.models.GroupMember.delete({ id: membership.id });
      // If this was the last member, delete the group so the cleanup lambda
      // doesn't have to catch it.
      if (members.length === 1) {
        await client.models.Group.delete({ id: group.id });
      }
      notifications.show({ color: 'teal', message: 'Left the group.' });
      navigate('/map');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await Promise.all(
        members.map((m) => client.models.GroupMember.delete({ id: m.id })),
      );
      await client.models.Group.delete({ id: group.id });
      notifications.show({ color: 'teal', message: 'Group deleted.' });
      navigate('/map');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <TopNav />
      <Box p="md" maw={560} mx="auto">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={14} />}
          onClick={() => navigate('/map')}
          mb="md"
        >
          Back to map
        </Button>
        <Stack gap="lg">
          <div>
            <Title order={3}>{group.name}</Title>
            {group.lastMemberJoinedAt && (
              <Text size="xs" c="dimmed">
                Last joined {new Date(group.lastMemberJoinedAt).toLocaleString()}
              </Text>
            )}
          </div>

          {isOwner && (
            <Group align="end">
              <TextInput
                label="Group name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Button onClick={handleRename} loading={saving}>
                Rename
              </Button>
            </Group>
          )}

          <div>
            <Title order={5}>Members ({members.length})</Title>
            <Stack gap="xs" mt="xs">
              {members.map((m) => {
                const u = usersById[m.userId];
                const name = u?.name ?? '…';
                const color = colorFromId(m.userId);
                return (
                  <Group key={m.id} gap="sm">
                    <Avatar
                      radius="xl"
                      size="sm"
                      style={{ background: color, color: 'white' }}
                    >
                      {name.slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Text>{name}</Text>
                    {m.userId === group.ownerId && (
                      <Text size="xs" c="dimmed">
                        owner
                      </Text>
                    )}
                  </Group>
                );
              })}
            </Stack>
          </div>

          <Divider />

          <Group>
            {myMembership && (
              <Button
                variant="light"
                color="red"
                leftSection={<IconLogout size={14} />}
                loading={saving}
                onClick={() => handleLeave(myMembership)}
              >
                Leave group
              </Button>
            )}
            {isOwner && (
              <Button
                variant="filled"
                color="red"
                leftSection={<IconTrash size={14} />}
                loading={saving}
                onClick={handleDelete}
              >
                Delete group
              </Button>
            )}
          </Group>
        </Stack>
      </Box>
    </Box>
  );
}
