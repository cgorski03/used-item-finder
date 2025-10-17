import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type WorkerDb = ReturnType<typeof getWorkerDb>;
export type WorkerDbConnection = ReturnType<typeof postgres>;

let _cachedConnection: WorkerDbConnection | undefined;


export function getWorkerDb(connectionString: string) {
    if (!_cachedConnection) {
        _cachedConnection = postgres(connectionString);
    }
    return drizzle(_cachedConnection, { schema });
}

export async function closeWorkerDb() {
    if (!_cachedConnection) {
        return;
    }
    await _cachedConnection.end();
}
