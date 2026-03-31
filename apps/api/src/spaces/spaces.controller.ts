import { Controller, UseGuards, Get, Post, Patch, Delete, Param, Body, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SpacesService } from './spaces.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/spaces')
export class SpacesController {
    constructor(private readonly spacesService: SpacesService) {}

    @Get()          findAll() { return this.spacesService.findAll(); }
    @Get(':id')     findOne(@Param('id') id: string) { return this.spacesService.findOne(id); }
    @Post()         create(@Body() body: { name: string; description?: string; metadata?: unknown }) {
        const trimmedName = body.name?.trim();
        if (!trimmedName) {
            throw new BadRequestException('Space name cannot be empty or contain only whitespace');
        }
        return this.spacesService.create({ ...body, name: trimmedName });
    }
    @Patch(':id')   update(@Param('id') id: string, @Body() body: Partial<{ name: string; description: string; metadata: unknown }>) {
        if (body.name !== undefined) {
            const trimmedName = body.name.trim();
            if (!trimmedName) {
                throw new BadRequestException('Space name cannot be empty or contain only whitespace');
            }
            body.name = trimmedName;
        }
        return this.spacesService.update(id, body);
    }
    @Delete(':id')  remove(@Param('id') id: string) { return this.spacesService.remove(id); }
}
