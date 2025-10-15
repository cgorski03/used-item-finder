import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema'

if (!process.env.CONN_STRING) {
  throw new Error("Set CONN_STRING environment variable!");
}

export const db = drizzle(neon(process.env.CONN_STRING!), { schema })
