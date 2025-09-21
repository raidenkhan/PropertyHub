import { Module } from '@nestjs/common';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { PaystackService } from 'src/payments/paystack.service';
import { ConfigService } from '@nestjs/config';


@Module({
  controllers: [ManagerController],
  providers: [ManagerService,PaystackService,ConfigService],
})
export class ManagerModule {}