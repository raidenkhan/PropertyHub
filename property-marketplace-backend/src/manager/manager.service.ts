import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException,
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  SuspendUserDto, 
  WarnUserDto, 
  ApproveRejectPropertyDto, 
  CreateReportDto 
} from './dto/manager.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

import { PaystackService } from 'src/payments/paystack.service';

@Injectable()
export class ManagerService {
  constructor(private prisma: PrismaService,private paystackService:PaystackService,private notificationsService: NotificationsService ) {}

  // === USER MODERATION ===
  async suspendUser(userId: number, dto: SuspendUserDto, managerId: number) {
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userRoles = user.userRoles.map(ur => ur.role.name);
    if (userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Cannot suspend admin users');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        updatedAt: new Date()
      },
    });
  }

  async activateUser(userId: number, managerId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: true,
        updatedAt: new Date()
      },
    });
  }

  // === PROPERTY MANAGEMENT ===
  async getPendingProperties() {
    return this.prisma.property.findMany({
      where: { 
         status: 'PENDING_VERIFICATION' 
      },
      include: {
        currentOwner: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        },
        listedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveProperty(propertyId: string, managerId: number,notes?:string) {
    try{const property = await this.prisma.property.findUnique({ 
      where: { propertyId } 
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException('Only pending properties can be approved');
    }

    const updatedProperty = await this.prisma.property.update({
      where: { propertyId },
      data: {
        status: 'VERIFIED',
        isVerified: true,
        verifiedById: managerId,
        verifiedAt: new Date(),
      },
    });

    // Create property history record
    await this.prisma.propertyHistory.create({
      data: {
        propertyId,
        toOwnerId: property.currentOwnerId,
        eventType: 'VERIFIED',
        notes: 'Property approved by manager'
      }
    });

    await this.notificationsService.notifyPropertyApproved(propertyId, managerId, notes);

    return updatedProperty;}catch(e){
      throw new Error(`Failed to approver property : ${e.message}`)
    }
  }

  async rejectProperty(propertyId, dto: ApproveRejectPropertyDto, managerId: number) {
    const property = await this.prisma.property.findUnique({ 
      where: { id: propertyId } 
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException('Only pending properties can be rejected');
    }

    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        status: 'DRAFT',
        isVerified: false,
        verifiedById: managerId,
        verifiedAt: new Date(),
      },
    });

    // Create property history record
    await this.prisma.propertyHistory.create({
      data: {
        propertyId,
        toOwnerId: property.currentOwnerId,
        eventType: 'VERIFIED',
        notes: `Property rejected: ${dto.reason}`
      }
    });

     await this.notificationsService.notifyPropertyRejected(propertyId, managerId, dto.reason);

    return updatedProperty;
  }

  async suspendProperty(propertyId: string, reason: string, managerId: number) {
    const property = await this.prisma.property.findUnique({ 
      where: {  propertyId } 
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const updatedProperty = await this.prisma.property.update({
      where: {  propertyId },
      data: {
        status: 'SUSPENDED',
      },
      
    });



    // Create property history record
    await this.prisma.propertyHistory.create({
      data: {
        propertyId,
        toOwnerId: property.currentOwnerId,
        eventType: 'SUSPENDED',
        notes: `Property suspended: ${reason}`
      }
    });

     await this.notificationsService.notifyPropertySuspended(propertyId, managerId, reason);

    return updatedProperty;
  }

  async releaseEscrow(transactionId: string, notes: string | undefined, managerId: number) {
  const transaction = await this.prisma.transaction.findUnique({
    where: { transactionId },
    include: { 
      property: true, 
      seller: true,
      buyer: true,
    },
  });

  if (!transaction) {
    throw new NotFoundException('Transaction not found');
  }

  if (transaction.status !== 'ESCROW') {
    throw new BadRequestException('Only escrow transactions can be released');
  }

  if (!transaction.seller.paystackRecipientCode) {
  throw new BadRequestException('Seller bank details not configured');
}
  // 1. Initiate Paystack transfer to seller
  try {
    const transferResponse = await this.paystackService.initiateTransfer({
      amount: transaction.amount, // or transaction.amount - transaction.escrowAmount
      recipient: transaction.seller.paystackRecipientCode,
      reason: `Escrow release for property: ${transaction.property.title}`,
      reference: `ESCROW_${transactionId}_${Date.now()}`,
    });

    if (!transferResponse.success) {
      throw new Error(`Paystack transfer failed: ${transferResponse.message}`);
    }

    // 2. Update transaction
    const updatedTransaction = await this.prisma.transaction.update({
      where: {  transactionId },
      data: {
        status: 'COMPLETED',
        escrowReleased: true,
        escrowReleasedById: managerId,
        escrowReleasedAt: new Date(),
        completedAt: new Date(),
        paymentReference: transferResponse.data.reference, // optional: store transfer ref
      },
    });

    // 3. Update property status
    if (transaction.property) {
      await this.prisma.property.update({
        where: { id: transaction.property.id },
        data: {
          status: 'SOLD',
          soldAt: new Date(),
        },
      });

      // 4. Add to property history
      await this.prisma.propertyHistory.create({
        data: {
          propertyId: transaction.property.propertyId,
          fromOwnerId: transaction.property.currentOwnerId,
          toOwnerId: transaction.buyerId,
          transactionId: transaction.transactionId,
          price: transaction.amount,
          eventType: 'SOLD',
          notes: notes || 'Sold via escrow release',
        },
      });
    }

    // 5. Invalidate cache
    // await this.redisCache.del('manager:escrow_transactions');
    // await this.redisCache.del('manager:dashboard_stats');
    await this.notificationsService.notifyEscrowReleased(transactionId, managerId);
    return updatedTransaction;

  } catch (paystackError) {
    // Log error but don't fail silently
    console.error('Paystack transfer failed:', paystackError);
    throw new BadRequestException(`Failed to release escrow: ${paystackError.message}`);
  }
}





  // === TRANSACTION MANAGEMENT ===
  async getAllTransactions() {
    return this.prisma.transaction.findMany({
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            type: true,
            propertyId: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        },
        disputes: {
          select: {
            id: true,
            status: true,
            title: true,
            priority: true,
          },
        },
        escrowReleasedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEscrowTransactions() {
    return this.prisma.transaction.findMany({
      where: { 
        status: 'ESCROW' 
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            propertyId: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // === DISPUTE MANAGEMENT ===
  async getAllDisputes() {
    return this.prisma.dispute.findMany({
      where: { 
        status: { not: 'RESOLVED' },
      },
      include: {
        complainant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        respondent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            propertyId: true,
          },
        },
        transaction: {
          select: {
            id: true,
            transactionId: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async escalateDispute(disputeId: number, managerId: number, reason?: string) {
    const dispute = await this.prisma.dispute.findUnique({ 
      where: { id: disputeId } 
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status === 'RESOLVED' || dispute.status === 'CLOSED') {
      throw new BadRequestException('Cannot escalate resolved or closed disputes');
    }

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        priority: 'HIGH',
        status: 'ESCALATED',
        updatedAt: new Date(),
      },
    });
  }

  async resolveDispute(disputeId: number, resolution: string, managerId: number) {
    const dispute = await this.prisma.dispute.findUnique({ 
      where: { id: disputeId } 
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Notify both parties
    await this.notificationsService.createNotification({
      userId: dispute.complainantId,
      type: 'DISPUTE_RESOLVED',
      title: '✅ Dispute Resolved',
      message: `Your dispute "${dispute.title}" has been resolved. Resolution: ${resolution}`,
      relatedDisputeId: disputeId,
      metadata: { resolution, managerName: 'Property Manager' }
    });

    await this.notificationsService.createNotification({
      userId: dispute.respondentId,
      type: 'DISPUTE_RESOLVED',
      title: '✅ Dispute Resolved',
      message: `The dispute "${dispute.title}" against you has been resolved. Resolution: ${resolution}`,
      relatedDisputeId: disputeId,
      metadata: { resolution, managerName: 'Property Manager' }
    });

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedById: managerId,
        resolvedAt: new Date(),
      },
    });
  }

  // === MESSAGE MANAGEMENT ===
  async getAllMessages() {
    return this.prisma.message.findMany({
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent messages
    });
  }

  // === USER MANAGEMENT ===
  async getAllUsers(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          userRoles: {
            include: { role: true }
          },
          ownedProperties: {
            select: {
              id: true,
              title: true,
              status: true,
            }
          },
          buyerTransactions: {
            select: {
              id: true,
              status: true,
              amount: true,
            }
          },
          sellerTransactions: {
            select: {
              id: true,
              status: true,
              amount: true,
            }
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // === STATISTICS ===
  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalProperties,
      verifiedProperties,
      pendingProperties,
      totalTransactions,
      escrowTransactions,
      completedTransactions,
      activeDisputes,
      resolvedDisputes,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.property.count(),
      this.prisma.property.count({ where: { isVerified: true } }),
      this.prisma.property.count({ where: { status: 'PENDING_VERIFICATION' } }),
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { status: 'ESCROW' } }),
      this.prisma.transaction.count({ where: { status: 'COMPLETED' } }),
      this.prisma.dispute.count({ where: { status: { not: 'RESOLVED' } } }),
      this.prisma.dispute.count({ where: { status: 'RESOLVED' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      properties: {
        total: totalProperties,
        verified: verifiedProperties,
        pending: pendingProperties,
        rejected: totalProperties - verifiedProperties - pendingProperties,
      },
      transactions: {
        total: totalTransactions,
        escrow: escrowTransactions,
        completed: completedTransactions,
        others: totalTransactions - escrowTransactions - completedTransactions,
      },
      disputes: {
        active: activeDisputes,
        resolved: resolvedDisputes,
        total: activeDisputes + resolvedDisputes,
      },
    };
  }
}