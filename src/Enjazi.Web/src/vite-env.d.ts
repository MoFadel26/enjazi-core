interface ImportMetaEnv {
  // The Clerk instance's publishable key, pk_test_... or pk_live_... Read at
  // build time, so it is baked into the bundle; it is not a secret.
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
}
