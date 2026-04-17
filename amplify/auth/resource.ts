import { defineAuth } from '@aws-amplify/backend';

// Phone-only sign-in. Client uses `signIn({ username: phone, options: {
// authFlowType: 'USER_AUTH', preferredChallenge: 'SMS_OTP' } })` then
// `confirmSignIn` with the 6-digit code from the SMS.
//
// Session length: Cognito rotates access/id tokens silently via the 365-day
// refresh token (set in ../backend.ts via the cfnUserPoolClient escape hatch).
export const auth = defineAuth({
  loginWith: {
    phone: true,
  },
  userAttributes: {
    phoneNumber: { required: true, mutable: false },
  },
});
