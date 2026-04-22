import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: {
      otpLogin: true,
    },
  },
  groups: ["dads"],
  userAttributes: {
    email: { required: true, mutable: true },
  },
});
