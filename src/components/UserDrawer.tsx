import {
  Button,
  Drawer,
  Group,
  Stack,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router';
import { IconHandStop, IconUsersGroup } from '@tabler/icons-react';
import { colorFromId } from '../lib/color';
import { ageRangeLabel } from '../constants/ageRanges';
import { usePing } from '../hooks/usePing';
import { useJoinGroup } from '../hooks/useJoinGroup';
import type { NearbyUser } from '../hooks/useNearbyUsers';

type Props = {
  user: NearbyUser | null;
  onClose: () => void;
  // If set, the drawer shows a "Join group" action instead of "Ping".
  joinGroupId?: string | null;
};

export function UserDrawer({ user, onClose, joinGroupId }: Props) {
  const navigate = useNavigate();
  const { ping, pending: pingPending } = usePing();
  const { join, pending: joinPending } = useJoinGroup();

  const handlePing = async () => {
    if (!user?.userId) return;
    const groupId = await ping(user.userId);
    if (groupId) {
      notifications.show({
        color: 'teal',
        title: 'Ping sent',
        message: `${user.name} will see your request.`,
      });
      onClose();
    } else {
      notifications.show({
        color: 'red',
        title: 'Ping failed',
        message: 'Try again in a moment.',
      });
    }
  };

  const handleJoin = async () => {
    if (!joinGroupId) return;
    const ok = await join(joinGroupId);
    if (ok) {
      notifications.show({
        color: 'teal',
        title: 'Joined group',
        message: 'You can now see the meeting place.',
      });
      onClose();
      navigate(`/groups/${joinGroupId}`);
    } else {
      notifications.show({
        color: 'red',
        title: 'Join failed',
        message: 'Try again in a moment.',
      });
    }
  };

  const color = user ? colorFromId(user.userId ?? user.id) : undefined;

  return (
    <Drawer
      opened={!!user}
      onClose={onClose}
      position="right"
      size="sm"
      title={user?.name ?? ''}
    >
      {user && (
        <Stack gap="md">
          <Group gap="xs">
            <Badge color="gray" variant="light" leftSection={
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: color,
                }}
              />
            }>
              {ageRangeLabel(user.ageRange)}
            </Badge>
          </Group>
          {joinGroupId ? (
            <Button
              leftSection={<IconUsersGroup size={16} />}
              loading={joinPending}
              onClick={handleJoin}
              fullWidth
            >
              Join group with {user.name}
            </Button>
          ) : (
            <Button
              leftSection={<IconHandStop size={16} />}
              loading={pingPending}
              onClick={handlePing}
              fullWidth
            >
              Ping {user.name}
            </Button>
          )}
        </Stack>
      )}
    </Drawer>
  );
}
