import { defineAuth } from '@aws-amplify/backend';

// Email + password sign-in. Session length: Cognito rotates access/id tokens
// silently via the 365-day refresh token (set in ../backend.ts via cfnUserPoolClient).
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: { required: true, mutable: false },
  },
});
