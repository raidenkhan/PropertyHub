import { PaystackService } from "src/payments/paystack.service";
import { UsersController } from "./user.controller";
import { UsersService } from "./users.service";
import { Module } from "@nestjs/common";
// import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "src/prisma/prisma.module";
import { PaymentModule } from "src/payments/payment.module";
//import { PrismaService } from "src/prisma/prisma.service";


@Module({
imports: [
    PrismaModule,
    PaymentModule, // ← ADD THIS — provides PaystackService
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
