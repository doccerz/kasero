import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { db, pool } from './database';

export const DB_TOKEN = 'DRIZZLE_DB';

@Global()
@Module({
    providers: [
        {
            provide: DB_TOKEN,
            useValue: db,
        },
    ],
    exports: [DB_TOKEN],
})
export class DatabaseModule implements OnApplicationShutdown {
    async onApplicationShutdown() {
        await pool.end();
    }
}
