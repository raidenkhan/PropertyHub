import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from 'src/gateway/chat.gateway';


@Module({
  controllers: [MessagesController],
  providers: [MessagesService],
  exports:[MessagesService]
})
export class MessagesModule {}
