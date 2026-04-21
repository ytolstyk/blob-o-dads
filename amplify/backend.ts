import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { cleanupSessions } from './functions/cleanup-sessions/resource.js';
import { fetchVenues } from './functions/fetch-venues/resource.js';
import { validateInterest } from './functions/validate-interest/resource.js';

const backend = defineBackend({
  auth,
  data,
  cleanupSessions,
  fetchVenues,
  validateInterest,
});

// Keep users signed in for months: 365-day refresh token.
const { cfnUserPoolClient } = backend.auth.resources.cfnResources;
cfnUserPoolClient.refreshTokenValidity = 365;
cfnUserPoolClient.tokenValidityUnits = {
  refreshToken: 'days',
};

export default backend;
