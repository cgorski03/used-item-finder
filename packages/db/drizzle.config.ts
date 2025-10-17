import { defineConfig } from 'drizzle-kit';

const isTest = process.env.NODE_ENV === "test";
const dbName = isTest ? "itemfinder_test" : "itemfinder";

export default defineConfig({
    schema: './schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: `postgres://colin:secure_password@localhost:5432/${dbName}`,
    },
    verbose: true,
    strict: true,
});
