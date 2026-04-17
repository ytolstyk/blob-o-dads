import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { cleanupGroups } from './functions/cleanup-groups/resource.js';

const backend = defineBackend({
  auth,
  data,
  cleanupGroups,
});

// Keep users signed in for months: 365-day refresh token.
// Access/id tokens stay short-lived; Amplify refreshes them silently.
const { cfnUserPoolClient } = backend.auth.resources.cfnResources;
cfnUserPoolClient.refreshTokenValidity = 365;
cfnUserPoolClient.tokenValidityUnits = {
  refreshToken: 'days',
};

export default backend;
