export const runtime = "nodejs";

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Build a safe connection string, ensuring the password is always a string
const connectionString =
  process.env.DATABASE_URL ??
  (process.env.DB_PASSWORD
    ? `postgresql://goodsale:${String(process.env.DB_PASSWORD)}@localhost:5432/goodsale`
    : undefined);

const pool = new Pool({
  connectionString,
});

// Create Drizzle database instance
export const db = drizzle(pool, { schema });

// Export all schema for use elsewhere
export * from './schema';
