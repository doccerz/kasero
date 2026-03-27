import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DB_TOKEN } from '../database/database.module';
import { spaces } from '../database/schema';

@Injectable()
export class SpacesService {
    constructor(@Inject(DB_TOKEN) private readonly db: any) {}

    async findAll(): Promise<typeof spaces.$inferSelect[]> {
        return this.db.select().from(spaces).where(isNull(spaces.deletedAt));
    }

    async findOne(id: string): Promise<typeof spaces.$inferSelect> {
        const rows = await this.db.select().from(spaces)
            .where(and(eq(spaces.id, id), isNull(spaces.deletedAt)));
        if (!rows[0]) throw new NotFoundException('Space not found');
        return rows[0];
    }

    async create(data: { name: string; description?: string; metadata?: unknown }) {
        const rows = await this.db.insert(spaces).values(data).returning();
        return rows[0];
    }

    async update(id: string, data: Partial<{ name: string; description: string; metadata: unknown }>) {
        const rows = await this.db.update(spaces)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(spaces.id, id), isNull(spaces.deletedAt)))
            .returning();
        if (!rows[0]) throw new NotFoundException('Space not found');
        return rows[0];
    }

    async remove(id: string) {
        const rows = await this.db.update(spaces)
            .set({ deletedAt: new Date() })
            .where(and(eq(spaces.id, id), isNull(spaces.deletedAt)))
            .returning();
        if (!rows[0]) throw new NotFoundException('Space not found');
        return rows[0];
    }
}
