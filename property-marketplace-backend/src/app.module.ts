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
import { ChatGateway } from './gateway/chat.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { WsJwtGuard } from './auth/guards/ws-jwt.guard';
import { NotificationsModule } from './notifications/notifications.module';
import { OffersModule } from './offer/offer.module';



@Module({
  imports: [AuthModule, UsersModule, PrismaModule, PropertiesModule,TransactionsModule,MessagesModule,ManagerModule,PaymentModule,AdminModule,NotificationsModule,OffersModule
    // ,MulterModule.register({
    //   dest:'./uploads'
    // })
    ,MessagesModule,ConfigModule.forRoot({isGlobal:true}),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService,ChatGateway,WsJwtGuard,],
})
export class AppModule {}
