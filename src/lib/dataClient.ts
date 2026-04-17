import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Single shared Amplify Data client. Import from here; don't call
// generateClient() elsewhere or subscriptions leak.
export const client = generateClient<Schema>();
