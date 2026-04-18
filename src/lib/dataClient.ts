import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

type Client = ReturnType<typeof generateClient<Schema>>;

let _client: Client | null = null;

function getInstance(): Client {
  if (!_client) _client = generateClient<Schema>();
  return _client;
}

export const client = new Proxy({} as Client, {
  get(_target, prop) {
    return getInstance()[prop as keyof Client];
  },
});
