import { Module } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { SpacesController } from './spaces.controller';

@Module({
  providers: [SpacesService],
  controllers: [SpacesController]
})
export class SpacesModule {}
