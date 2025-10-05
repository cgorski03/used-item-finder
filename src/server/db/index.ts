import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from './schema';

const client = new Client({
  connectionString: 'postgres://colin:secure_password@localhost:5432/itemfinder',
});

await client.connect();
export const db = drizzle(client, { schema });
