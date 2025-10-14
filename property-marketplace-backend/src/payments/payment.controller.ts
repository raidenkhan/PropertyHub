import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { PaymentService, InitializePaymentDto, VerifyPaymentDto } from './payment.service';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// DTOs for request validation
export class InitializePaymentRequestDto {
  id: number;
  callback_url?: string;
  metadata?: any;
}

export class VerifyPaymentRequestDto {
  reference: string;
}

export class ReleaseEscrowDto {
  notes?: string;
}

export class PaymentQueryDto {
  page?: number = 1;
  limit?: number = 10;
  status?: string;
  role?: 'buyer' | 'seller' | 'all' = 'all';
}

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly webhookService: WebhookService,
  ) {}

  // === USER PAYMENT ENDPOINTS ===

  /**
   * Initialize payment for a transaction
   */
  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  async initializePayment(
    @Body() dto,
    @Req() req,
  ) {
   
    try {
      const result = await this.paymentService.initializePayment(
        {
          id: dto.id,
          callback_url: dto.callback_url,
          metadata: dto.metadata,
        },
        req.user.userId,
      );

      return {
        status: 'success',
        message: 'Payment initialized successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Verify payment after user completes payment
   */
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(@Body() dto) {
    console.log(" Transaction reference dto : ",dto)
    try {
      const result = await this.paymentService.verifyPayment({
        reference: dto.reference,
      });

      return {
        status: result.success ? 'success' : 'failed',
        message: result.message,
        data: {
          transaction: result.transaction,
          payment_successful: result.success,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get payment/transaction status
   */
  @Get('transaction/:id/status')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(
    @Param('id', ParseIntPipe) transactionId: number,
    @Req() req,
  ) {
    try {
      const result = await this.paymentService.getPaymentStatus(
        transactionId,
        req.user.userId,
      );

      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get user's transaction/payment history
   */
  @Get('my-transactions')
  @UseGuards(JwtAuthGuard)
  async getUserTransactions(
    @Query() query: PaymentQueryDto,
    @Req() req,
  ) {
    try {
      const result = await this.paymentService.getUserTransactions(
        req.user.userId,
        {
          page: Number(query.page) || 1,
          limit: Number(query.limit) || 10,
          role: query.role,
        },
      );

      return {
        status: 'success',
        data: result.transactions,
        pagination: result.pagination,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // === ADMIN/MANAGER ENDPOINTS ===

  /**
   * Get all transactions (Admin only)
   */
  @Get('transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ESCROW_MANAGER')
  async getAllTransactions(@Query() query: PaymentQueryDto) {
    try {
      const result = await this.paymentService.getAllTransactions({
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 20,
        status: query.status,
      });

      return {
        status: 'success',
        data: result.transactions,
        pagination: result.pagination,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Release escrow funds (Admin/Manager only)
   */
  @Post('transactions/:id/release-escrow')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ESCROW_MANAGER')
  async releaseEscrow(
    @Param('id') transactionId: string,
    @Body() dto: ReleaseEscrowDto,
    @Req() req,
  ) {
    try {
      const result = await this.paymentService.releaseEscrow(
        transactionId,
        req.user.userId,
        dto.notes,
      );

      return {
        status: 'success',
        message: 'Escrow released successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get payment statistics for dashboard
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ESCROW_MANAGER')
  async getPaymentStats() {
    try {
      const stats = await this.paymentService.getPaymentStats();

      return {
        status: 'success',
        data: stats,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // === WEBHOOK ENDPOINTS ===

  /**
   * Handle Paystack webhooks
   */
  @Post('webhook')
  async handleWebhook(@Body() payload: any, @Req() req) {
    try {
      // Get signature from headers
      const signature = req.headers['x-paystack-signature'];
      
      if (!signature) {
        throw new BadRequestException('Missing webhook signature');
      }

      const result = await this.webhookService.handleWebhook(payload, signature);

      return result;
    } catch (error) {
      // Log error but return 200 to prevent Paystack retries for invalid signatures
      console.error('Webhook error:', error.message);
      
      if (error.message.includes('Invalid webhook signature')) {
        return { status: 'error', message: 'Invalid signature' };
      }

      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get webhook statistics (Admin only)
   */
  @Get('webhook/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getWebhookStats() {
    try {
      const stats = await this.webhookService.getWebhookStats();

      return {
        status: 'success',
        data: stats,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Test webhook (Development only)
   */
  @Post('webhook/test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async testWebhook(
    @Body() body: { eventType: string; testData?: any },
  ) {
    try {
      const result = await this.webhookService.testWebhook(
        body.eventType,
        body.testData,
      );

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Manually sync transaction with Paystack
   */
  @Post('transactions/:id/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ESCROW_MANAGER')
  async syncTransaction(@Param('id', ParseIntPipe) transactionId: number) {
    try {
      const result = await this.webhookService.syncTransactionStatus(transactionId);

      return {
        status: 'success',
        message: 'Transaction synced successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // === UTILITY ENDPOINTS ===

  /**
   * Get transaction by ID (for both buyer and seller)
   */
  @Get('transactions/:id')
  @UseGuards(JwtAuthGuard)
  async getTransaction(
    @Param('id', ParseIntPipe) transactionId: number,
    @Req() req,
  ) {
    try {
      const result = await this.paymentService.getPaymentStatus(
        transactionId,
        req.user.userId,
      );

      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Payment callback endpoint (for frontend redirects)
   */
  @Get('callback')
  async paymentCallback(
    @Query('reference') reference: string,
    @Query('trxref') trxref: string,
  ) {
    try {
      // Use reference or trxref (Paystack uses both)
      const paymentReference = reference || trxref;
      
      if (!paymentReference) {
        return {
          status: 'error',
          message: 'Missing payment reference',
        };
      }

      const result = await this.paymentService.verifyPayment({
        reference: paymentReference,
      });

      // Return a simple response that frontend can handle
      return {
        status: result.success ? 'success' : 'failed',
        message: result.message,
        reference: paymentReference,
        transaction_id: result.transaction.id,
        redirect_url: result.success 
          ? `/transactions/${result.transaction.id}/success`
          : `/transactions/${result.transaction.id}/failed`,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        reference: reference || trxref,
      };
    }
  }

  /**
   * Check if transaction can be paid (validation endpoint)
   */
  @Get('transactions/:id/can-pay')
  @UseGuards(JwtAuthGuard)
  async canPayTransaction(
    @Param('id', ParseIntPipe) transactionId: number,
    @Req() req,
  ) {
    try {
      const transaction = await this.paymentService.getPaymentStatus(
        transactionId,
        req.user.userId,
      );

      const canPay = 
        transaction.transaction.status === 'PENDING' &&
        transaction.transaction.buyerId === req.user.userId;

      return {
        status: 'success',
        data: {
          can_pay: canPay,
          transaction_status: transaction.payment_status,
          reason: !canPay 
            ? transaction.transaction.status !== 'PENDING' 
              ? 'Transaction is not in pending status'
              : 'You are not the buyer for this transaction'
            : 'Transaction can be paid',
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}