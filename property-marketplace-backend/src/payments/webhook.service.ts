import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './paystack.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private paystack: PaystackService,
  ) {}

  /**
   * Handle incoming webhook from Paystack
   * Since we don't have a webhookEvent model, we'll log and process directly
   */
  async handleWebhook(payload: any, signature: string) {
    try {
      // Verify webhook signature
      const payloadString = JSON.stringify(payload);
      const isValid = this.paystack.verifyWebhookSignature(payloadString, signature);

      if (!isValid) {
        throw new BadRequestException('Invalid webhook signature');
      }

      this.logger.log(`Received webhook: ${payload.event}`);

      // Process the webhook directly (since we don't have webhookEvent model)
      await this.processWebhookEvent(payload);

      return { status: 'success', message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Process webhook event based on event type
   */
  private async processWebhookEvent(payload: any) {
    try {
      const eventType = payload.event;
      const eventData = payload.data;

      this.logger.log(`Processing webhook event: ${eventType}`);

      switch (eventType) {
        case 'charge.success':
          await this.handleChargeSuccess(eventData);
          break;

        case 'charge.failed':
          await this.handleChargeFailed(eventData);
          break;

        case 'transfer.success':
          await this.handleTransferSuccess(eventData);
          break;

        case 'transfer.failed':
          await this.handleTransferFailed(eventData);
          break;

        case 'refund.success':
          await this.handleRefundSuccess(eventData);
          break;

        case 'refund.failed':
          await this.handleRefundFailed(eventData);
          break;

        default:
          this.logger.warn(`Unhandled webhook event type: ${eventType}`);
      }

      this.logger.log(`Webhook event ${eventType} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process webhook event:`, error);
      throw error;
    }
  }

  /**
   * Handle successful charge (payment)
   */
private async handleChargeSuccess(data: any) {
  const reference = data.reference;

  // Find transaction by payment reference
  const transaction = await this.prisma.transaction.findFirst({
    where: { paymentReference: reference },
  });

  if (!transaction) {
    this.logger.warn(`Transaction not found for reference: ${reference}`);
    return;
  }

  // Update transaction status to ESCROW
  await this.prisma.transaction.update({
    where: { id: transaction.id },
     data:{
      status: 'ESCROW', // move to ESCROW status
      paymentMethod: data.channel || 'PAYSTACK',
      updatedAt: new Date(),
    },
  });

  this.logger.log(`Transaction ${transaction.id} moved to escrow via webhook`);
}
  /**
   * Handle failed charge (payment)
   */
  private async handleChargeFailed(data: any) {
    const reference = data.reference;

    this.logger.log(`Processing failed charge for reference: ${reference}`);

    // Find transaction by payment reference
    const transaction = await this.prisma.transaction.findFirst({
      where: { paymentReference: reference },
    });

    if (!transaction) {
      this.logger.warn(`Transaction not found for reference: ${reference}`);
      return;
    }

    // Update transaction status to cancelled
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { 
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    // Update property back to listed if it was under offer
    await this.prisma.property.update({
      where: { id: transaction.propertyId },
      data: { status: 'LISTED' },
    });

    this.logger.log(`Transaction ${transaction.id} cancelled due to payment failure`);
  }

  /**
   * Handle successful transfer (payout to seller)
   */
  private async handleTransferSuccess(data: any) {
    this.logger.log(`Transfer successful: ${data.reference}`);
    
    // Since we don't have automatic payouts implemented yet,
    // this is mainly for logging purposes
    // TODO: Implement automatic seller payouts when needed
  }

  /**
   * Handle failed transfer (payout to seller)
   */
  private async handleTransferFailed(data: any) {
    this.logger.error(`Transfer failed: ${data.reference} - ${data.failure_reason}`);
    
    // TODO: Handle failed payout - maybe retry or notify admin
    // For now, just log the failure
  }

  /**
   * Handle successful refund
   */
  private async handleRefundSuccess(data: any) {
    this.logger.log(`Refund successful for transaction: ${data.reference}`);

    // Find transaction by original payment reference
    // Note: Refund reference might be different from original payment reference
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        OR: [
          { paymentReference: data.reference },
          { transactionId: data.reference }, // If using transaction ID as reference
        ]
      },
    });

    if (!transaction) {
      this.logger.warn(`Transaction not found for refund reference: ${data.reference}`);
      return;
    }

    // Update transaction status
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { 
        status: 'CANCELLED', // Use CANCELLED since we don't have REFUNDED status
        updatedAt: new Date(),
      },
    });

    // If escrow was released, we might need to handle this case
    if (transaction.escrowReleased) {
      this.logger.warn(`Refund processed for transaction ${transaction.id} but escrow was already released`);
    }

    // Update property back to listed
    await this.prisma.property.update({
      where: { id: transaction.propertyId },
      data: { 
        status: 'LISTED',
        soldAt: null, // Clear sold date if it was set
      },
    });

    this.logger.log(`Transaction ${transaction.id} refunded successfully`);
  }

  /**
   * Handle failed refund
   */
  private async handleRefundFailed(data: any) {
    this.logger.error(`Refund failed: ${data.reference} - ${data.failure_reason || 'Unknown reason'}`);
    
    // Just log the failure for now
    // TODO: Implement proper refund failure handling if needed
  }

  /**
   * Move transaction to escrow status
   */
  private async moveTransactionToEscrow(transaction: any, paymentData: any) {
    const escrowAmount = transaction.amount * 0.1; // 10% escrow amount

    // Update transaction with escrow details
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'ESCROW',
        escrowAmount: escrowAmount,
        paymentMethod: paymentData.channel || 'PAYSTACK',
        updatedAt: new Date(),
      },
    });

    // Update property status to under offer
    await this.prisma.property.update({
      where: { id: transaction.propertyId },
      data: { status: 'UNDER_OFFER' },
    });

    this.logger.log(`Transaction ${transaction.id} moved to escrow with amount ${escrowAmount}`);
  }

  /**
   * Get webhook processing statistics
   * Since we don't store webhook events, we'll return transaction-based stats
   */
  async getWebhookStats() {
    const [
      totalTransactions,
      pendingTransactions,
      escrowTransactions,
      completedTransactions,
      cancelledTransactions,
    ] = await Promise.all([
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { status: 'PENDING' } }),
      this.prisma.transaction.count({ where: { status: 'ESCROW' } }),
      this.prisma.transaction.count({ where: { status: 'COMPLETED' } }),
      this.prisma.transaction.count({ where: { status: 'CANCELLED' } }),
    ]);

    return {
      summary: {
        totalTransactions,
        pendingTransactions,
        escrowTransactions,
        completedTransactions,
        cancelledTransactions,
      },
      successRate: totalTransactions > 0 ? ((completedTransactions / totalTransactions) * 100).toFixed(2) : '0.00',
      message: 'Statistics based on transaction status (webhook events not stored)',
    };
  }

  /**
   * Test webhook endpoint (for development)
   */
  async testWebhook(eventType: string, testData?: any) {
    const mockPayload = {
      event: eventType,
      data: testData || {
        reference: `TEST_${Date.now()}`,
        status: eventType.includes('success') ? 'success' : 'failed',
        amount: 100000, // 1000 Naira in kobo
        channel: 'card',
        paid_at: new Date().toISOString(),
      },
    };

    this.logger.log(`Processing test webhook: ${eventType}`);
    
    try {
      await this.processWebhookEvent(mockPayload);
      return { 
        status: 'success', 
        message: `Test webhook ${eventType} processed successfully`,
        payload: mockPayload,
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: `Test webhook failed: ${error.message}`,
        payload: mockPayload,
      };
    }
  }

  /**
   * Manually sync transaction status with Paystack
   */
  async syncTransactionStatus(transactionId: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (!transaction.paymentReference) {
      throw new BadRequestException('Transaction has no payment reference to sync');
    }

    try {
      // Verify payment status with Paystack
      const paystackResponse = await this.paystack.verifyPayment(transaction.paymentReference);
      
      if (paystackResponse.status && paystackResponse.data) {
        const paystackData = paystackResponse.data;
        const isSuccessful = paystackData.status === 'success';

        if (isSuccessful && transaction.status === 'PENDING') {
          await this.moveTransactionToEscrow(transaction, paystackData);
          this.logger.log(`Transaction ${transactionId} synced and moved to escrow`);
        } else if (!isSuccessful && transaction.status === 'PENDING') {
          await this.prisma.transaction.update({
            where: { id: transactionId },
            data: { status: 'CANCELLED' },
          });
          this.logger.log(`Transaction ${transactionId} synced and cancelled`);
        }

        return {
          success: true,
          message: 'Transaction status synchronized',
          paystack_status: paystackData.status,
          local_status: transaction.status,
        };
      }

      throw new BadRequestException('Invalid Paystack response');
    } catch (error) {
      this.logger.error(`Failed to sync transaction ${transactionId}:`, error);
      throw new BadRequestException(`Sync failed: ${error.message}`);
    }
  }
}