import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Group,
  Button,
  ActionIcon,
  Menu,
  Text,
  Avatar,
} from '@mantine/core';
import { IconLogout, IconUserEdit, IconDotsVertical } from '@tabler/icons-react';
import { signOut } from 'aws-amplify/auth';
import { EditProfileModal } from './EditProfileModal';
import { useMe } from '../hooks/useMe';

export function TopNav() {
  const navigate = useNavigate();
  const me = useMe();
  const [editOpen, setEditOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <Group
        justify="space-between"
        px="md"
        py="xs"
        style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
      >
        <Group gap="sm">
          <Avatar radius="xl" size="sm" color="blue">
            {(me.profile?.name ?? '?').slice(0, 1).toUpperCase()}
          </Avatar>
          <Text fw={600}>{me.profile?.name ?? 'Blob-o-dads'}</Text>
        </Group>
        <Group gap="xs">
          <Button
            variant="light"
            size="xs"
            leftSection={<IconUserEdit size={14} />}
            onClick={() => setEditOpen(true)}
          >
            Edit profile
          </Button>
          <Menu position="bottom-end" width={180}>
            <Menu.Target>
              <ActionIcon variant="subtle" aria-label="More">
                <IconDotsVertical size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconLogout size={14} />}
                onClick={handleLogout}
                color="red"
              >
                Log out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
      <EditProfileModal
        key={editOpen ? (me.profile?.id ?? 'open') : 'closed'}
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        profile={me.profile ?? null}
      />
    </>
  );
}
