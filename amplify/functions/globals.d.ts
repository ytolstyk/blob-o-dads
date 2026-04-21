// Stubs for modules that are generated/resolved only after `ampx sandbox` runs.
// These declarations let the app tsconfig type-check handlers before deployment.
// No top-level imports — this must remain an ambient (non-module) declaration file.

declare module '$amplify/env/*' {
  const env: Record<string, string | undefined>;
  export { env };
}

declare module '@aws-amplify/backend/function/runtime' {
  export function getAmplifyDataClientConfig(
    env: Record<string, string | undefined>,
  ): Promise<{
    resourceConfig: import('aws-amplify').ResourcesConfig;
    libraryOptions: import('aws-amplify').LibraryOptions;
  }>;
}
