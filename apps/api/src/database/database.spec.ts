import { db, pool } from './database';

const hasDatabaseUrl = !!process.env.DATABASE_URL;

describe('Database', () => {
    afterAll(async () => {
        if (hasDatabaseUrl) {
            await pool.end();
        }
    });

    it('should export db instance', () => {
        expect(db).toBeDefined();
    });

    it('should export pool instance', () => {
        expect(pool).toBeDefined();
    });

    (hasDatabaseUrl ? it : it.skip)('should connect to the database', async () => {
        const client = await pool.connect();
        const result = await client.query('SELECT 1 as value');
        client.release();
        expect(result.rows[0].value).toBe(1);
    });
});
