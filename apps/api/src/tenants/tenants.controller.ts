import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantsService } from './tenants.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) {}

    @Get()         findAll() { return this.tenantsService.findAll(); }
    @Get(':id')    findOne(@Param('id') id: string) { return this.tenantsService.findOne(id); }
    @Post()        create(@Body() body: { firstName: string; lastName: string; contactInfo?: unknown; metadata?: unknown }) { return this.tenantsService.create(body); }
    @Patch(':id')  update(@Param('id') id: string, @Body() body: Partial<{ firstName: string; lastName: string; contactInfo: unknown; metadata: unknown }>) { return this.tenantsService.update(id, body); }
}
