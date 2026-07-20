// Defaults so `npm run test:e2e` works out of the box against the compose db
// (localhost:5432). Real env vars (docker/CI) always win.
process.env.PGHOST ??= 'localhost';
process.env.PGUSER ??= 'app';
process.env.PGPASSWORD ??= 'app';
process.env.PGDATABASE ??= 'patients';
