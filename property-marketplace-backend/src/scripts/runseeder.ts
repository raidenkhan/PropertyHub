// src/scripts/seed-db.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module'; // 👈 Make sure this path is correct
import { DatabaseSeeder } from './seeddb';
import { PrismaService } from 'src/prisma/prisma.service';

async function bootstrap() {
  // ✅ Create NestJS app context — this resolves all modules/services
  const app = await NestFactory.createApplicationContext(AppModule);

  // ✅ Get PrismaService from Nest container
  const prisma = app.get(PrismaService);

  // ✅ Initialize seeder
  const seeder = new DatabaseSeeder(prisma);

  try {
    await seeder.seedDatabase();
  } catch (error) {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
  } finally {
    await app.close(); // 👈 Always close app context
  }
}

bootstrap();