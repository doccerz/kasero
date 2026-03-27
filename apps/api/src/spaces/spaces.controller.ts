import { Controller, UseGuards, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SpacesService } from './spaces.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/spaces')
export class SpacesController {
    constructor(private readonly spacesService: SpacesService) {}

    @Get()          findAll() { return this.spacesService.findAll(); }
    @Get(':id')     findOne(@Param('id') id: string) { return this.spacesService.findOne(id); }
    @Post()         create(@Body() body: { name: string; description?: string; metadata?: unknown }) { return this.spacesService.create(body); }
    @Patch(':id')   update(@Param('id') id: string, @Body() body: Partial<{ name: string; description: string; metadata: unknown }>) { return this.spacesService.update(id, body); }
    @Delete(':id')  remove(@Param('id') id: string) { return this.spacesService.remove(id); }
}
