import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DB_TOKEN } from '../database/database.module';
import { settings } from '../database/schema';

@Injectable()
export class SettingsService implements OnApplicationBootstrap {
    private cache = new Map<string, string>();

    constructor(@Inject(DB_TOKEN) private readonly db: any) {}

    async onApplicationBootstrap(): Promise<void> {
        await this.loadSettings();
    }

    async loadSettings(): Promise<void> {
        const rows = await this.db.select().from(settings);
        this.cache.clear();
        for (const row of rows) this.cache.set(row.key, row.value);
    }

    get(key: string): string | undefined {
        return this.cache.get(key);
    }

    getBoolean(key: string, defaultValue = false): boolean {
        const val = this.cache.get(key);
        if (val === undefined) return defaultValue;
        return val === 'true';
    }
}
