import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function getWorkerDb(connectionString: string) {
    const client = postgres(connectionString);
    return drizzle(client, { schema });
}
