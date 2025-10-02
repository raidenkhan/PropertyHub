import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PropertyService } from '../properties/properties.service';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private propertyService: PropertyService
  ) {}

  async initiateTransaction(buyerId: number, propertyId: number, offerAmount: number) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { currentOwner: true }
    });
      
    if (!property) {
      throw new NotFoundException('Property not found');
    }

      
    if (property.status !== 'LISTED') {
      throw new BadRequestException('Property is not available for sale');
    }
    
    if (property.currentOwnerId === buyerId) {
      throw new BadRequestException('You cannot buy your own property');
    }
    
     
    // Create transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        buyerId,
        sellerId: property.currentOwnerId,
        propertyId,
        amount: offerAmount,
        escrowAmount: offerAmount,
        status: 'PENDING'
        
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, propertyId: true, title: true } }
      }
    });

    
    // Update property status
    await this.prisma.property.update({
      where: { id: propertyId },
      data: { status: 'UNDER_OFFER' }
    });
    
    
    return transaction;
  }

 async releaseEscrow(transactionId: number, releaserId: number, notes?: string) {
    // 1. Get transaction + releaser
    const [transaction, releaser] = await Promise.all([
      this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          buyer: true,
          seller: true,
          property: true,
        },
      }),
      this.prisma.user.findUnique({
        where: { id: releaserId },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      }),
    ]);

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }if (!releaser) {
      throw new ForbiddenException('Releaser not found');
    }

    // 2. Check releaser has permission
    const releaserRoles = releaser.userRoles.map(ur => ur.role.name);
    const canRelease = releaserRoles.some(role =>
      ['ESCROW_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(role)
    );

    if (!canRelease) {
      throw new ForbiddenException('Only Escrow Managers or Admins can release escrow');
    }

    // 3. Validate transaction status
    if (!['ESCROW', 'PAYMENT_CONFIRMED'].includes(transaction.status)) {
      throw new BadRequestException(`Cannot release escrow: transaction is ${transaction.status}`);
    }

    // 4. Update transaction
    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transactionId },
       data:{
        status: 'COMPLETED',
        escrowReleased: true,
        escrowReleasedById: releaserId,
        escrowReleasedAt: new Date(),
        ...(notes ? { paymentReference: notes } : {}),
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, title: true } },
      },
    });
      await this.propertyService.transferOwnership(
      transaction.propertyId,
      transaction.buyerId,
      transaction.id,
      transaction.amount
    );
    return updatedTransaction;
  }
  // In TransactionService
async getTransactionById(id: number) {
  const transaction = await this.prisma.transaction.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      property: { 
        select: { 
          id: true, 
          title: true, 
          location: true, 
          images: true 
        } 
      },
    },
  });

  if (!transaction) {
    throw new NotFoundException('Transaction not found');
  }

  return transaction;
}

  async acceptOffer(transactionId: number, sellerId: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { property: true }
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.sellerId !== sellerId) {
      throw new ForbiddenException('Only the seller can accept this offer');
    }

    if (transaction.status !== 'PENDING') {
      throw new BadRequestException('Transaction is not in pending state');
    }

    // Move to escrow
    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'ESCROW' }
    });

    return updatedTransaction;
  }

  // async releaseEscrow(transactionId: number, managerId: number) {
  //   // Check if manager has permission
  //   const manager = await this.prisma.user.findUnique({
  //     where: { id: managerId },
  //     include: {
  //       userRoles: {
  //         include: { role: true }
  //       }
  //     }
  //   });

  //   const managerRoles = manager?.userRoles.map(ur => ur.role.name);
  //   if (!managerRoles?.includes('ESCROW_MANAGER') && !managerRoles?.includes('ADMIN') && !managerRoles?.includes('SUPER_ADMIN')) {
  //     throw new ForbiddenException('Insufficient permissions to release escrow');
  //   }

  //   const transaction = await this.prisma.transaction.findUnique({
  //     where: { id: transactionId },
  //     include: { property: true }
  //   });

  //   if (!transaction) {
  //     throw new NotFoundException('Transaction not found');
  //   }

  //   if (transaction.status !== 'ESCROW') {
  //     throw new BadRequestException('Transaction is not in escrow state');
  //   }

  //   // Complete the transaction
  //   const completedTransaction = await this.prisma.transaction.update({
  //     where: { id: transactionId },
  //     data: {
  //       status: 'COMPLETED',
  //       escrowReleased: true,
  //       escrowReleasedById: managerId,
  //       escrowReleasedAt: new Date(),
  //       completedAt: new Date()
  //     }
  //   });

  //   // Transfer property ownership
  //   await this.propertyService.transferOwnership(
  //     transaction.propertyId,
  //     transaction.buyerId,
  //     transaction.id,
  //     transaction.amount
  //   );

  //   return completedTransaction;
  // }

  async cancelTransaction(transactionId: number, userId: number, reason?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Only buyer, seller, or admin can cancel
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            include: { role: true }
          }
        }
      });

      const userRoles = user?.userRoles.map(ur => ur.role.name);
      const isAdmin = userRoles?.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role));

      if (!isAdmin) {
        throw new ForbiddenException('Only transaction parties or admins can cancel transactions');
      }
    }

    if (['COMPLETED', 'CANCELLED'].includes(transaction.status)) {
      throw new BadRequestException('Cannot cancel a completed or already cancelled transaction');
    }

    // Cancel transaction
    const cancelledTransaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'CANCELLED' }
    });

    // Update property back to listed
    await this.prisma.property.update({
      where: { id: transaction.propertyId },
      data: { status: 'LISTED' }
    });

    return cancelledTransaction;
  }

  async getTransactionHistory(userId: number, role: 'buyer' | 'seller' | 'all' = 'all') {
    const where: any = {};

    if (role === 'buyer') {
      where.buyerId = userId;
    } else if (role === 'seller') {
      where.sellerId = userId;
    } else {
      where.OR = [
        { buyerId: userId },
        { sellerId: userId }
      ];
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        property: { 
          select: { 
            id: true, 
            propertyId: true, 
            title: true, 
            location: true,
            images: true
          } 
        },
        escrowReleasedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTransactionStats(userId?: number) {
    const where = userId ? {
      OR: [{ buyerId: userId }, { sellerId: userId }]
    } : {};

    const [total, pending, escrow, completed, cancelled] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.transaction.count({ where: { ...where, status: 'ESCROW' } }),
      this.prisma.transaction.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.transaction.count({ where: { ...where, status: 'CANCELLED' } })
    ]);

    return {
      total,
      pending,
      escrow,
      completed,
      cancelled
    };
  }
}