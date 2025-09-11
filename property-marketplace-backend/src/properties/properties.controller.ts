import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { OwnershipGuard } from 'src/auth/guards/ownership.guard';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreatePropertyDto, @Req() req) {
  
    return this.propertiesService.create(dto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto, @Req() req) {
    return this.propertiesService.update(+id, dto, req.user.sub);
  }

 

  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(+id);
  }
}
