import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgres://colin:secure_password@localhost:5432/itemfinder',
  },
  verbose: true,
  strict: true,
});
