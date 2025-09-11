import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async create(createPropertyDto: CreatePropertyDto, ownerId: number) {
    return this.prisma.property.create({
      data: {
        ...createPropertyDto,
        ownerId,
      },
    });
  }

  async findAll() {
    return this.prisma.property.findMany({
      include: { owner: true },
    });
  }

  async findOne(id: number) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!property) throw new NotFoundException(`Property ${id} not found`);
    return property;
  }

  async update(id: number, updatePropertyDto: UpdatePropertyDto, ownerId: number) {
    return this.prisma.property.update({
      where: { id },
      data: { ...updatePropertyDto, ownerId },
    });
  }

  async remove(id: number) {
    return this.prisma.property.delete({
      where: { id },
    });
  }
}
