// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Global } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
@Global()
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'], // Configure logging
      errorFormat: 'pretty',
    });
     
  }
  async onModuleInit() {
    await this.$connect(); // Connect to DB when the module starts
  }

  async onModuleDestroy() {
    await this.$disconnect(); // Gracefully disconnect on shutdown
  }
}
