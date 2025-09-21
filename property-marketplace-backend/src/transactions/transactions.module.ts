import { Module } from '@nestjs/common';
import { TransactionService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PropertiesModule } from 'src/properties/properties.module';

@Module({
  imports: [PrismaModule, PropertiesModule],
  controllers: [TransactionsController],
  providers: [TransactionService],
})
export class TransactionsModule {}
