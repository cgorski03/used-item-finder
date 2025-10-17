import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type WorkerDb = ReturnType<typeof getWorkerDb>;
export type WorkerDbConnection = ReturnType<typeof postgres>;

let _client: ReturnType<typeof postgres> | undefined;

export function getWorkerDb(connectionString: string) {
    _client = postgres(connectionString);
    return drizzle(_client, { schema });
}

export async function closeWorkerDb() {
    if (!_client) {
        return;
    }
    await _client.end();
}
