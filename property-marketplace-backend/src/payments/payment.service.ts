import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { ConfigService } from '@nestjs/config';

export interface InitializePaymentDto {
  
  id: number;
  callback_url?: string;
  metadata?: any;
}

export interface VerifyPaymentDto {
  reference: string;
}

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private paystack: PaystackService,
    private config: ConfigService,
  ) {}

  /**
   * Initialize payment for a transaction
   */
  async initializePayment(dto: InitializePaymentDto, userId: number) {
    // Get transaction details

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: dto.id },
      include: {
        buyer: true,
        seller: true,
        property: true,
        
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify user is the buyer
    if (transaction.buyerId !== userId) {
      throw new BadRequestException('Only the buyer can initiate payment for this transaction');
    }

    // Check if transaction is in correct status
    if (transaction.status !== 'PENDING') {
      throw new BadRequestException('Transaction must be in PENDING status to initiate payment');
    }

    // Calculate platform fee and net amount (you can adjust these calculations)
    const platformFee = this.calculatePlatformFee(transaction.amount);
    const netAmount = transaction.amount - platformFee;
    const amountInKobo = this.nairaToKobo(transaction.amount);

    // Generate unique reference
    const reference = this.generateReference();

    // Update transaction with payment details
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentReference: reference,
        paymentMethod: 'PAYSTACK',
      },
    });

    // Ensure user has phone number for Paystack
    // if (!transaction.buyer.phone) {
    //   throw new BadRequestException('Buyer must have a phone number for payment processing');
    // }
   
    // Initialize payment with Paystack
    const paystackResponse = await this.paystack.initializePayment({
      email: transaction.buyer.email,
      amount: amountInKobo,
      reference,
      callback_url: dto.callback_url,
      metadata: {
        transaction_id: transaction.id,
        property_title: transaction.property.title,
        buyer_id: userId,
        seller_id: transaction.sellerId,
        platform_fee: platformFee,
        net_amount: netAmount,
        ...dto.metadata,
      },
    });

    return {
      transaction_id: transaction.id,
      reference,
      authorization_url: paystackResponse.data.authorization_url,
      access_code: paystackResponse.data.access_code,
      amount: transaction.amount,
      platform_fee: platformFee,
      net_amount: netAmount,
    };
  }

  /**
   * Verify payment and update records
   */
  async verifyPayment(dto) {
    // Find transaction by reference
    const transaction = await this.prisma.transaction.findFirst({
      where: { paymentReference: dto.reference },
      include: {
        buyer: true,
        seller: true,
        property: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found for this payment reference');
    }

    // Verify with Paystack
    const paystackResponse = await this.paystack.verifyPayment(dto.reference);

    if (!paystackResponse.status || !paystackResponse.data) {
      throw new BadRequestException('Payment verification failed');
    }

    const paystackData = paystackResponse.data;
    const isSuccessful = paystackData.status === 'success';

    // Update transaction based on payment result
    if (isSuccessful) {
      await this.moveToEscrow(transaction, paystackData);
    } else {
      // Update transaction status to failed
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'CANCELLED',
          updatedAt: new Date()
        },
      });
    }

    return {
      transaction,
      paystack_data: paystackData,
      success: isSuccessful,
      message: isSuccessful ? 'Payment successful - funds moved to escrow' : 'Payment failed - transaction cancelled'
    };
  }

  /**
   * Get payment status by transaction ID
   */
  async getPaymentStatus(transactionId: number, userId?: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: {
          select: { id: true, name: true, email: true },
        },
        seller: {
          select: { id: true, name: true, email: true },
        },
        property: {
          select: { id: true, title: true, location: true, propertyId: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Check if user has permission to view this transaction
    if (userId && transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new BadRequestException('You do not have permission to view this transaction');
    }

    return {
      transaction,
      payment_status: transaction.status,
      payment_reference: transaction.paymentReference,
      payment_method: transaction.paymentMethod,
      escrow_amount: transaction.escrowAmount,
      escrow_released: transaction.escrowReleased,
      escrow_released_at: transaction.escrowReleasedAt,
    };
  }

  /**
   * Get user's transaction/payment history
   */
  async getUserTransactions(userId: number, options?: { page?: number; limit?: number; role?: 'buyer' | 'seller' | 'all' }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    const role = options?.role || 'all';

    let whereClause: any = {};
    
    if (role === 'buyer') {
      whereClause.buyerId = userId;
    } else if (role === 'seller') {
      whereClause.sellerId = userId;
    } else {
      whereClause.OR = [
        { buyerId: userId },
        { sellerId: userId }
      ];
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: whereClause,
        include: {
          property: {
            select: { id: true, title: true, location: true, propertyId: true },
          },
          buyer: {
            select: { id: true, name: true, email: true },
          },
          seller: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: whereClause }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all transactions (Admin/Manager only)
   */
  async getAllTransactions(options: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status.toUpperCase();

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          buyer: {
            select: { id: true, name: true, email: true },
          },
          seller: {
            select: { id: true, name: true, email: true },
          },
          property: {
            select: { id: true, title: true, location: true, propertyId: true },
          },
          escrowReleasedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Release escrow funds (Admin/Manager only)
   */
  async releaseEscrow(transactionId: string, managerId: number, notes?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { transactionId },
      include: {
        property: true,
        buyer: true,
        seller: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'ESCROW') {
      throw new BadRequestException('Transaction must be in ESCROW status to release funds');
    }

    if (transaction.escrowReleased) {
      throw new BadRequestException('Escrow has already been released');
    }

    // Update transaction
    const updatedTransaction = await this.prisma.transaction.update({
      where: { transactionId },
      data: {
        status: 'COMPLETED',
        escrowReleased: true,
        escrowReleasedById: managerId,
        escrowReleasedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Transfer property ownership
    await this.prisma.property.update({
      where: { propertyId: transaction.propertyId },
      data: {
        currentOwnerId: transaction.buyerId,
        status: 'SOLD',
        soldAt: new Date(),
      },
    });

    // Create property history record
    await this.prisma.propertyHistory.create({
      data: {
        propertyId: transaction.propertyId,
        fromOwnerId: transaction.sellerId,
        toOwnerId: transaction.buyerId,
        transactionId: transaction.transactionId,
        price: transaction.amount,
        eventType: 'SOLD',
        notes: notes || 'Property sold and ownership transferred',
      },
    });

    return updatedTransaction;
  }

  /**
   * Private: Move successful payment to escrow
   */
  private async moveToEscrow(transaction: any, paystackData: any) {
    const escrowAmount = transaction.amount; // Hold 100% of the funds in escrow
    const autoReleaseAt = new Date();
    const escrowDays = parseInt(this.config.get<string>('ESCROW_AUTO_RELEASE_DAYS') || '30');
    autoReleaseAt.setDate(autoReleaseAt.getDate() + escrowDays);

    // Update transaction status and payment details
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'ESCROW',
        escrowAmount: escrowAmount,
        paymentMethod: paystackData.channel || 'PAYSTACK',
        updatedAt: new Date(),
      },
    });

    // Update property status
    await this.prisma.property.update({
      where: { id: transaction.propertyId },
      data: {
        status: 'UNDER_OFFER',
      },
    });
  }

  /**
   * Calculate platform fee (you can customize this logic)
   */
  private calculatePlatformFee(amount: number): number {
    // Example: 2.5% platform fee with minimum of ₦100
    const feePercentage = 0.025;
    const calculatedFee = amount * feePercentage;
    const minimumFee = 100;
    
    return Math.max(calculatedFee, minimumFee);
  }

  /**
   * Convert Naira to Kobo (Paystack uses kobo)
   */
  private nairaToKobo(nairaAmount: number): number {
    return Math.round(nairaAmount * 100);
  }

  /**
   * Generate unique payment reference
   */
  private generateReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PROP_${timestamp}_${random}`;
  }

  /**
   * Get payment statistics for dashboard
   */
  async getPaymentStats() {
    const [
      totalTransactions,
      pendingPayments,
      escrowTransactions,
      completedTransactions,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { status: 'PENDING' } }),
      this.prisma.transaction.count({ where: { status: 'ESCROW' } }),
      this.prisma.transaction.count({ where: { status: 'COMPLETED' } }),
      this.prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalTransactions,
      pendingPayments,
      escrowTransactions,
      completedTransactions,
      totalRevenue: totalRevenue._sum.amount || 0,
      successRate: totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0,
    };
  }
}