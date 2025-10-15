import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from './schema';

const client = new Client({
    connectionString: 'postgres://colin:secure_password@localhost:5432/itemfinder',
});

const connectAndDrizzle = async () => {
    await client.connect();
    return drizzle(client, { schema });
};

export * from './schema';
export const db = connectAndDrizzle();

export const pgClient = client;
