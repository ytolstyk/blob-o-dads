import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  AgeRange: a.enum([
    'R_18_25',
    'R_22_30',
    'R_25_35',
    'R_30_40',
    'R_35_45',
    'R_40_50',
    'R_45_55',
    'R_50_60',
    'R_55_65',
    'R_60_PLUS',
  ]),
  // User.userId is the Cognito sub. We look up "me" via
  // `list({ filter: { userId: { eq: sub }}})`.
  User: a
    .model({
      userId: a.string().required(),
      name: a.string().required(),
      ageRange: a.ref('AgeRange').required(),
      lat: a.float(),
      lng: a.float(),
      geohashPrefix: a.string(),
      lastSeenAt: a.datetime(),
      onboardedAt: a.datetime(),
    })
    .secondaryIndexes((index) => [
      index('userId'),
      index('geohashPrefix').sortKeys(['lastSeenAt']),
    ])
    .authorization((allow) => [
      allow.ownerDefinedIn('userId').to(['create', 'read', 'update', 'delete']),
      // Peers read each other's profile + obfuscated position.
      // Pre-launch: replace with a custom resolver that projects away raw lat/lng.
      allow.authenticated().to(['read']),
    ]),

  Group: a
    .model({
      name: a.string().required(),
      ownerId: a.string().required(),
      lastMemberJoinedAt: a.datetime(),
      members: a.hasMany('GroupMember', 'groupId'),
      pings: a.hasMany('Ping', 'groupId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update']),
      allow.ownerDefinedIn('ownerId').to(['delete']),
    ]),

  GroupMember: a
    .model({
      groupId: a.id().required(),
      userId: a.string().required(),
      joinedAt: a.datetime().required(),
      group: a.belongsTo('Group', 'groupId'),
    })
    .secondaryIndexes((index) => [index('groupId'), index('userId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']),
      allow.ownerDefinedIn('userId').to(['delete']),
    ]),

  Ping: a
    .model({
      fromUserId: a.string().required(),
      toUserId: a.string().required(),
      groupId: a.id().required(),
      createdAt: a.datetime().required(),
      group: a.belongsTo('Group', 'groupId'),
    })
    .secondaryIndexes((index) => [index('toUserId').sortKeys(['createdAt'])])
    .authorization((allow) => [allow.authenticated().to(['create', 'read'])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
