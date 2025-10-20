import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "./schema";

const getDb = () => {
    if (process.env.NODE_ENV == 'TEST') {
        return 'itemfinder_test'
    }
    return 'itemfinder'
}

export const client = new Client({
    connectionString: `postgres://colin:secure_password@localhost:5432/${getDb()}`
});

let isConnected = false;

const connectAndDrizzle = async () => {
    if (!isConnected) {
        await client.connect();
        isConnected = true;
    }
    return drizzle({ client, schema });
};

export const db = connectAndDrizzle();
export type Database = Awaited<ReturnType<typeof connectAndDrizzle>>;
