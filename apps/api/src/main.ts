import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './config/config';
import { runMigrations } from './database/migrate';
import { seedDefaultSettings, seedAdminUser, seedAppVersion } from './database/seed';

async function bootstrap() {
    if (process.env.DATABASE_URL) {
        await runMigrations();
        await seedDefaultSettings();
        await seedAdminUser(appConfig.adminUsername, appConfig.adminPassword!);
        await seedAppVersion('1.0.0');
    }
    const app = await NestFactory.create(AppModule);
    await app.listen(appConfig.apiPort);
}
bootstrap();
