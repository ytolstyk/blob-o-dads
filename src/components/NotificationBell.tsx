import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Indicator,
  Popover,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { usePingInbox, type Ping } from '../hooks/usePingInbox';
import { useMyGroups } from '../hooks/useMyGroups';

type Props = {
  onSelectPing?: (ping: Ping) => void;
};

export function NotificationBell({ onSelectPing }: Props) {
  const { pings, unreadCount, markAllRead } = usePingInbox();
  const { groupIds } = useMyGroups();
  const [opened, setOpened] = useState(false);

  // Hide pings whose group the user has already joined.
  const pending = useMemo(
    () => pings.filter((p) => !groupIds.has(p.groupId)),
    [pings, groupIds],
  );

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      shadow="md"
      width={300}
    >
      <Popover.Target>
        <Indicator
          label={unreadCount}
          size={16}
          disabled={unreadCount === 0}
          color="red"
          offset={4}
        >
          <ActionIcon
            variant="subtle"
            onClick={() => {
              setOpened((o) => !o);
              markAllRead();
            }}
            aria-label="Notifications"
          >
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>
      <Popover.Dropdown p="sm">
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={600}>Pings</Text>
            {pending.length > 0 && (
              <Badge variant="light">{pending.length}</Badge>
            )}
          </Group>
          {pending.length === 0 ? (
            <Text size="sm" c="dimmed">
              Nothing new.
            </Text>
          ) : (
            <ScrollArea.Autosize mah={240}>
              <Stack gap="xs">
                {pending.map((p) => (
                  <Button
                    key={p.id}
                    variant="light"
                    fullWidth
                    justify="start"
                    onClick={() => {
                      setOpened(false);
                      onSelectPing?.(p);
                    }}
                  >
                    New ping · {new Date(p.createdAt).toLocaleTimeString()}
                  </Button>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
