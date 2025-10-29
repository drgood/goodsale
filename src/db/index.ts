import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle database instance
export const db = drizzle(pool, { schema });

// Export all schema for use elsewhere
export * from './schema';
