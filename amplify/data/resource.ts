import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { cleanupSessions } from '../functions/cleanup-sessions/resource.js';
import { fetchVenues } from '../functions/fetch-venues/resource.js';
import { validateInterest } from '../functions/validate-interest/resource.js';

const schema = a
  .schema({
    VenueType: a.enum(['PARK', 'CAFE', 'MALL', 'LIBRARY']),
    SessionStatus: a.enum(['PENDING', 'ACTIVE', 'EXPIRED']),

    User: a
      .model({
        userId: a.string().required(),
        name: a.string().required(),
        onboardedAt: a.datetime(),
      })
      .secondaryIndexes((index) => [index('userId')])
      .authorization((allow) => [
        allow.ownerDefinedIn('userId').to(['create', 'read', 'update', 'delete']),
        allow.authenticated().to(['read']),
      ]),

    Venue: a
      .model({
        name: a.string().required(),
        type: a.ref('VenueType').required(),
        lat: a.float().required(),
        lng: a.float().required(),
        googlePlaceId: a.string().required(),
        venueUpdatedAt: a.datetime(),
        sessions: a.hasMany('MeetupSession', 'venueId'),
      })
      .secondaryIndexes((index) => [index('googlePlaceId')])
      .authorization((allow) => [allow.authenticated().to(['read'])]),

    MeetupSession: a
      .model({
        venueId: a.id().required(),
        venue: a.belongsTo('Venue', 'venueId'),
        status: a.ref('SessionStatus').required(),
        quorumCount: a.integer().required(),
        targetTime: a.datetime(),
        sessionDate: a.string().required(),
        participants: a.hasMany('DadsInSession', 'sessionId'),
      })
      .secondaryIndexes((index) => [
        index('venueId').sortKeys(['sessionDate']),
        index('sessionDate'),
      ])
      .authorization((allow) => [allow.authenticated().to(['create', 'read', 'update'])]),

    DadsInSession: a
      .model({
        sessionId: a.id().required(),
        session: a.belongsTo('MeetupSession', 'sessionId'),
        userId: a.string().required(),
        nickname: a.string().required(),
        voteSlot: a.integer(),
      })
      .secondaryIndexes((index) => [index('sessionId'), index('userId')])
      .authorization((allow) => [
        allow.authenticated().to(['create', 'read', 'update']),
        allow.ownerDefinedIn('userId').to(['delete']),
      ]),

    validateInterest: a
      .mutation()
      .arguments({
        venueId: a.id().required(),
        userLat: a.float().required(),
        userLng: a.float().required(),
      })
      .returns(
        a.customType({
          approved: a.boolean().required(),
          sessionId: a.string(),
          reason: a.string(),
        }),
      )
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(validateInterest)),

    fetchNearbyVenues: a
      .query()
      .arguments({
        lat: a.float().required(),
        lng: a.float().required(),
      })
      .returns(a.id().array())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(fetchVenues)),
  })
  // Grant all three lambdas read/write access to every model.
  .authorization((allow) => [
    allow.resource(cleanupSessions),
    allow.resource(fetchVenues),
    allow.resource(validateInterest),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
