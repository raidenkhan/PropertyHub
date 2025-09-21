import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(senderId: number, dto: CreateMessageDto) {
    // Validate that both users exist
    const [sender, receiver] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: senderId } }),
      this.prisma.user.findUnique({ where: { id: dto.receiverId } })
    ]);

    if (!sender) {
      throw new ForbiddenException('Sender not found');
    }

    if (!receiver) {
      throw new ForbiddenException('Receiver not found');
    }

    if (!sender.isActive || !receiver.isActive) {
      throw new ForbiddenException('Cannot send message to inactive user');
    }

    // Create the message directly
    return this.prisma.message.create({
      data: {
        content: dto.content,
        senderId,
        receiverId: dto.receiverId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });
  }



  async findConversation(userId: number, otherUserId: number) {
    // Validate users exist and user has access
    const [user, otherUser] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.user.findUnique({ where: { id: otherUserId } })
    ]);

    if (!user || !otherUser) {
      throw new ForbiddenException('User not found');
    }

    // Get all messages between these two users
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });
  }

  async findAllForAdmin() {
    return this.prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        }
      },
      take: 1000 // Limit for performance
    });
  }

  // Get all conversations for a user (list of people they've messaged with)
  async getUserConversations(userId: number) {
    // Get unique conversation partners
    const sentMessages = await this.prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId']
    });

    const receivedMessages = await this.prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId']
    });

    // Combine and deduplicate conversation partner IDs
    const partnerIds = [
      ...sentMessages.map(m => m.receiverId),
      ...receivedMessages.map(m => m.senderId)
    ].filter((id, index, array) => array.indexOf(id) === index);

    // Get conversation details with last message
    const conversations = await Promise.all(
      partnerIds.map(async (partnerId) => {
        const [partner, lastMessage] = await Promise.all([
          this.prisma.user.findUnique({
            where: { id: partnerId },
            select: {
              id: true,
              name: true,
              avatar: true,
              isActive: true
            }
          }),
          this.prisma.message.findFirst({
            where: {
              OR: [
                { senderId: userId, receiverId: partnerId },
                { senderId: partnerId, receiverId: userId }
              ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          })
        ]);

        return {
          partner,
          lastMessage,
          unreadCount: await this.getUnreadCount(userId, partnerId)
        };
      })
    );

    // Sort by last message date
    return conversations
      //.filter(conv => conv.partner && conv.lastMessage)
      //.sort((a, b) => 
        //new Date(b.lastMessage?.createdAt).getTime() - 
        //new Date(a.lastMessage?.createdAt).getTime()
     // );
  }

  // Mark messages as read
  async markAsRead(userId: number, otherUserId: number) {
    return this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
  }

  // Get unread message count between two users
  async getUnreadCount(userId: number, otherUserId: number): Promise<number> {
    return this.prisma.message.count({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      }
    });
  }

  // Get total unread count for a user
  async getTotalUnreadCount(userId: number): Promise<number> {
    return this.prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });
  }

  // Delete a message (only sender can delete)
  async deleteMessage(messageId: number, userId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new ForbiddenException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    return this.prisma.message.delete({
      where: { id: messageId }
    });
  }

  // Search messages (for admin)
  async searchMessages(query: string, limit: number = 100) {
    return this.prisma.message.findMany({
      where: {
        content: {
          contains: query,
          mode: 'insensitive'
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  // Get message statistics (for admin dashboard)
  async getMessageStats() {
    const [totalMessages, todayMessages, activeConversations] = await Promise.all([
      this.prisma.message.count(),
      this.prisma.message.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      this.prisma.message.groupBy({
        by: ['senderId', 'receiverId'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }).then(groups => groups.length)
    ]);

    return {
      totalMessages,
      todayMessages,
      activeConversations
    };
  }
}