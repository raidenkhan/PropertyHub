import { AdminController } from "./admin.controller";
import { UsersService } from "../users/users.service";
import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { UsersModule } from "src/users/user.module";
import { PaymentModule } from "src/payments/payment.module";

@Module({
    imports: [
    PrismaModule,
    UsersModule,
    PaymentModule, // — provides PaystackService
  ],
  controllers: [AdminController],
  providers: [UsersService],
  exports: [UsersService],
})
export class AdminModule {}
