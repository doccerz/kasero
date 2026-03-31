import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SpacesService } from './spaces.service';
import { SpacesController } from './spaces.controller';

@Module({
    imports: [AuthModule],
    providers: [SpacesService],
    controllers: [SpacesController],
})
export class SpacesModule {}
