import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { DB_TOKEN } from '../database/database.module';
import { adminUsers } from '../database/schema';

@Injectable()
export class ProfileService {
    constructor(@Inject(DB_TOKEN) private readonly db: any) {}

    async getProfile(userId: string) {
        const rows = await this.db
            .select({ id: adminUsers.id, username: adminUsers.username, name: adminUsers.name, email: adminUsers.email })
            .from(adminUsers)
            .where(eq(adminUsers.id, userId))
            .limit(1);
        return rows[0];
    }

    async updateProfile(userId: string, data: { name?: string; email?: string }) {
        const rows = await this.db
            .update(adminUsers)
            .set(data)
            .where(eq(adminUsers.id, userId))
            .returning({ id: adminUsers.id, username: adminUsers.username, name: adminUsers.name, email: adminUsers.email });
        return rows[0];
    }

    async updatePassword(userId: string, data: { currentPassword: string; newPassword: string }) {
        const rows = await this.db.select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
        const user = rows[0];
        if (!user) throw new UnauthorizedException();

        const match = await compare(data.currentPassword, user.passwordHash);
        if (!match) throw new UnauthorizedException('Current password is incorrect');

        const passwordHash = await hash(data.newPassword, 10);
        await this.db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, userId));
    }
}
