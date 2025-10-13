// offers.module.ts
import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [OffersController],
  providers: [OffersService, PrismaService],
  exports: [OffersService], // Export service so other modules can use it
})
export class OffersModule {}