import { defineFunction, secret } from '@aws-amplify/backend';

export const fetchVenues = defineFunction({
  name: 'fetch-venues',
  entry: './handler.ts',
  timeoutSeconds: 15,
  environment: {
    GOOGLE_PLACES_API_KEY: secret('GOOGLE_PLACES_API_KEY'),
  },
});
