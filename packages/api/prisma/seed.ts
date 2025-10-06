// Mock seed script for development mode without a database connection.
// This simply logs the intention to seed and exits successfully.

async function main() {
  // eslint-disable-next-line no-console
  console.log('[seed] Prisma client seed skipped (no database connection available).');
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[seed] Unexpected error in mock seed script:', error);
  process.exit(1);
});