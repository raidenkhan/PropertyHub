import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaystackService } from './paystack.service';
import { WebhookService } from './webhook.service';


@Module({
  imports: [ConfigModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaystackService,
    WebhookService,
   
  ],
  exports: [PaymentService, PaystackService], // Export services for use in other modules
})
export class PaymentModule {}