import { Module } from '@nestjs/common';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { PaystackService } from 'src/payments/paystack.service';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from 'src/notifications/notifications.service';


@Module({
  controllers: [ManagerController],
  providers: [ManagerService,PaystackService,ConfigService,NotificationsService],
})
export class ManagerModule {}