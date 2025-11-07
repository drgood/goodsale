import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load env in the same order Next.js does: .env then override with .env.local if present
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
