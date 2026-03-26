import { Module } from '@nestjs/common';
import { LedgersService } from './ledgers.service';
import { LedgersController } from './ledgers.controller';

@Module({
  providers: [LedgersService],
  controllers: [LedgersController]
})
export class LedgersModule {}
