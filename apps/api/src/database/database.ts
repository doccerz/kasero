import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Use DATABASE_URL_LOCAL for local development/testing (host machine → db container via exposed port)
// Fall back to DATABASE_URL for Docker Compose networking (app container → db container)
const databaseUrl = process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL;

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });
