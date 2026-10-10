import { defineConfig } from 'drizzle-kit';

// Generates SQL migrations for the SQLite repository implementation from
// `sqlite/schema.ts`. Used only by `npm run db:generate`; the API applies the
// generated files itself at startup (`sqlite/database.ts`).
export default defineConfig({
  dialect: 'sqlite',
  schema: './sqlite/schema.ts',
  out: './sqlite/migrations',
});
