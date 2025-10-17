import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "./schema";

export const client = new Client({
    connectionString: "postgres://colin:secure_password@localhost:5432/itemfinder_test"
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
