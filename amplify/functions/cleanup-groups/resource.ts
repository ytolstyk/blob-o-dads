import { defineFunction } from '@aws-amplify/backend';

// Periodic sweep of stale groups:
//   - empty (0 members) → delete the group
//   - solo (1 member) older than 1h → delete the member + group
// Runs every 5 minutes. The in-app leave flow also deletes the group when
// the last member leaves; this lambda is a safety net.
export const cleanupGroups = defineFunction({
  name: 'cleanup-groups',
  entry: './handler.ts',
  schedule: 'every 5m',
  timeoutSeconds: 60,
});
