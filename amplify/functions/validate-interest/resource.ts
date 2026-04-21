import { defineFunction } from '@aws-amplify/backend';

export const validateInterest = defineFunction({
  name: 'validate-interest',
  entry: './handler.ts',
  timeoutSeconds: 10,
});
