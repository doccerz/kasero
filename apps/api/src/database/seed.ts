import { hash } from 'bcryptjs';
import { db } from './database';
import { settings, adminUsers, appVersion } from './schema';

export async function seedDefaultSettings(): Promise<void> {
    await db.insert(settings)
        .values({ key: 'tenant.hide_expired', value: 'true' })
        .onConflictDoNothing();
}

export async function seedAdminUser(username: string, password: string): Promise<void> {
    const passwordHash = await hash(password, 10);
    await db.insert(adminUsers)
        .values({ username, passwordHash })
        .onConflictDoNothing();
}

export async function seedAppVersion(version: string): Promise<void> {
    const existing = await db.select().from(appVersion).limit(1);
    if (existing.length === 0) {
        await db.insert(appVersion).values({ version });
    }
}

if (require.main === module) {
    (async () => {
        await seedDefaultSettings();
        const username = process.env.ADMIN_USERNAME ?? 'admin';
        const password = process.env.ADMIN_PASSWORD!;
        if (password) {
            await seedAdminUser(username, password);
        }
        await seedAppVersion('1.0.0');
        process.exit(0);
    })();
}
