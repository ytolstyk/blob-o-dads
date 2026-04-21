import { defineFunction } from '@aws-amplify/backend';

export const cleanupSessions = defineFunction({
  name: 'cleanup-sessions',
  entry: './handler.ts',
  schedule: 'every 30m',
  timeoutSeconds: 60,
});
