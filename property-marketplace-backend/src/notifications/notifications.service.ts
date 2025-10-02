// Backend: notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedPropertyId?: number;
  relatedTransactionId?: number;
  relatedDisputeId?: number;
  metadata?: any;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Create a new notification
  async createNotification(data: CreateNotificationDto) {
    return this.prisma.notification.create({
      data,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        property: {
          select: { id: true, title: true, propertyId: true }
        },
        transaction: {
          select: { id: true, transactionId: true, amount: true }
        },
        dispute: {
          select: { id: true, disputeId: true, title: true }
        }
      }
    });
  }

  // Get all notifications for a user
  async getUserNotifications(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        include: {
          property: {
            select: { id: true, title: true, propertyId: true }
          },
          transaction: {
            select: { id: true, transactionId: true, amount: true }
          },
          dispute: {
            select: { id: true, disputeId: true, title: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.notification.count({ where: { userId } })
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get unread notifications count
  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  }

  // Mark notification as read
  async markAsRead(notificationId: number, userId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  // Delete old notifications (cleanup job)
  async deleteOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        isRead: true
      }
    });
  }

  // Property-specific notification creators
  async notifyPropertyApproved(propertyId: number, managerId: number, notes?: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        currentOwner: { select: { id: true, name: true } }
      }
    });

    if (!property) throw new Error('Property not found');

    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { name: true }
    });

    return this.createNotification({
      userId: property.currentOwnerId,
      type: 'PROPERTY_APPROVED',
      title: '🎉 Property Approved!',
      message: `Your property "${property.title}" has been approved by ${manager?.name || 'Property Manager'} and is now live on the platform.`,
      relatedPropertyId: propertyId,
      metadata: {
        managerName: manager?.name,
        managerNotes: notes,
        propertyTitle: property.title
      }
    });
  }

  async notifyPropertyRejected(propertyId: number, managerId: number, reason: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        currentOwner: { select: { id: true, name: true } }
      }
    });

    if (!property) throw new Error('Property not found');

    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { name: true }
    });

    return this.createNotification({
      userId: property.currentOwnerId,
      type: 'PROPERTY_REJECTED',
      title: '❌ Property Rejected',
      message: `Your property "${property.title}" has been rejected. Reason: ${reason}`,
      relatedPropertyId: propertyId,
      metadata: {
        managerName: manager?.name,
        rejectionReason: reason,
        propertyTitle: property.title
      }
    });
  }

  async notifyPropertySuspended(propertyId: number, managerId: number, reason: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        currentOwner: { select: { id: true, name: true } }
      }
    });

    if (!property) throw new Error('Property not found');

    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { name: true }
    });

    return this.createNotification({
      userId: property.currentOwnerId,
      type: 'PROPERTY_SUSPENDED',
      title: '⚠️ Property Suspended',
      message: `Your property "${property.title}" has been suspended. Reason: ${reason}`,
      relatedPropertyId: propertyId,
      metadata: {
        managerName: manager?.name,
        suspensionReason: reason,
        propertyTitle: property.title
      }
    });
  }

  // Transaction notifications
  async notifyEscrowReleased(transactionId: number, managerId: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        seller: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true } },
        property: { select: { title: true } }
      }
    });

    if (!transaction) throw new Error('Transaction not found');

    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { name: true }
    });

    // Notify seller
    await this.createNotification({
      userId: transaction.sellerId,
      type: 'TRANSACTION_ESCROW_RELEASED',
      title: '💰 Escrow Released',
      message: `Escrow of ₦${transaction.amount.toLocaleString()} has been released for your property "${transaction.property.title}".`,
      relatedTransactionId: transactionId,
      metadata: {
        managerName: manager?.name,
        amount: transaction.amount,
        propertyTitle: transaction.property.title,
        buyerName: transaction.buyer.name
      }
    });

    // Notify buyer
    return this.createNotification({
      userId: transaction.buyerId,
      type: 'TRANSACTION_COMPLETED',
      title: '✅ Transaction Completed',
      message: `Your transaction for "${transaction.property.title}" has been completed. Escrow has been released to the seller.`,
      relatedTransactionId: transactionId,
      metadata: {
        managerName: manager?.name,
        amount: transaction.amount,
        propertyTitle: transaction.property.title,
        sellerName: transaction.seller.name
      }
    });
  }

  // System notifications
  async createSystemAnnouncement(userIds: number[], title: string, message: string) {
    const notifications = userIds.map(userId => ({
      userId,
      type: 'SYSTEM_ANNOUNCEMENT' as NotificationType,
      title,
      message,
      metadata: {
        isSystemMessage: true
      }
    }));

    return this.prisma.notification.createMany({
      data: notifications
    });
  }
}