export function assertSeedAllowed(settings: { env: string; allowSeedWipe: boolean }): void {
  if (settings.env === 'production') {
    throw new Error('Refusing to seed in production.');
  }
  if (!settings.allowSeedWipe) {
    throw new Error(
      'The seed deletes all users, tasks and availability. Set ALLOW_SEED_WIPE=true in backend/.env to confirm.',
    );
  }
}
