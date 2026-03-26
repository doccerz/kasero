import path from 'path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './database';

export async function runMigrations(): Promise<void> {
    const migrationsFolder = process.env.MIGRATIONS_PATH
        ?? path.join(__dirname, '../../drizzle/migrations');
    await migrate(db, { migrationsFolder });
}
