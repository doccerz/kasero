import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LedgersService } from './ledgers.service';
import { LedgersController } from './ledgers.controller';

@Module({
    imports: [AuthModule],
    providers: [LedgersService],
    controllers: [LedgersController],
})
export class LedgersModule {}
