import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: 'postgres://colin:secure_password@localhost:5432/itemfinder',
    },
    verbose: true,
    strict: true,
});
