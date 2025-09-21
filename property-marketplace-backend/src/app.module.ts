import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { TransactionsModule } from './transactions/transactions.module';
import { MessagesModule } from './messages/messages.module';
import { ManagerModule } from './manager/manager.module';
import { PaymentModule } from './payments/payment.module';
import { AdminModule } from './admin/admin.module';


@Module({
  imports: [AuthModule, UsersModule, PrismaModule, PropertiesModule,TransactionsModule,MessagesModule,ManagerModule,PaymentModule,AdminModule
    // ,MulterModule.register({
    //   dest:'./uploads'
    // })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
