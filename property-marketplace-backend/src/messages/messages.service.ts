import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(senderId: number, dto: CreateMessageDto) {
    return this.prisma.message.create({
      data: {
        content: dto.content,
        senderId,
        receiverId: dto.receiverId,
      },
    });
  }

  async findConversation(userId: number, otherUserId: number) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllForAdmin() {
    return this.prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
