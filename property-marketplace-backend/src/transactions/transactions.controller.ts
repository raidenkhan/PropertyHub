import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Req, 
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  ForbiddenException,
  Query
} from '@nestjs/common';
import { TransactionService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionService) {}


@Get(':id')
async getTransaction(@Param('id', ParseIntPipe) id: number, @Req() req) {
  try {
    // Verify user has access to this transaction
    const transaction = await this.transactionsService.getTransactionById(id);
    
    if (transaction.buyerId !== req.user.userId && transaction.sellerId !== req.user.userId) {
      throw new ForbiddenException('You do not have permission to view this transaction');
    }

    return {
      status: 'success',
       transaction,
    };
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}


  /**
   * Initiate a new transaction (buyer)
   */
  @Post('initiate')
  async initiateTransaction(@Body() dto: CreateTransactionDto, @Req() req) {
    try {
      const transaction = await this.transactionsService.initiateTransaction(
        req.user.userId,
        dto.propertyId,
        dto.offerAmount
      );
      
      console.log('Transaction initiated:', transaction); 
      return {
        status: 'success',
        message: 'Transaction initiated successfully',
        data: transaction,
      };
    } catch (error) {
      
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get transaction history for the current user
   */
  @Get('history')
  async getHistory(@Req() req, @Query('role') role: 'buyer' | 'seller' | 'all' = 'all') {
    try {
      const history = await this.transactionsService.getTransactionHistory(req.user.userId, role);
      
      return {
        status: 'success',
        data: history,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get transaction statistics for the current user
   */
  @Get('stats')
  async getStats(@Req() req) {
    try {
      const stats = await this.transactionsService.getTransactionStats(req.user.userId);
      
      return {
        status: 'success',
        data: stats,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Accept an offer (seller)
   */
  @Patch(':id/accept-offer')
  async acceptOffer(@Param('id', ParseIntPipe) id: number, @Req() req) {
    try {
      const transaction = await this.transactionsService.acceptOffer(id, req.user.userId);
      
      return {
        status: 'success',
        message: 'Offer accepted, transaction moved to escrow',
        data: transaction,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Release escrow funds (escrow manager/admin)
   */

  /**
   * Cancel a transaction (buyer, seller, or admin)
   */
  @Patch(':id/cancel')
  async cancelTransaction(@Param('id', ParseIntPipe) id: number, @Req() req, @Body() body: { reason?: string }) {
    try {
      const transaction = await this.transactionsService.cancelTransaction(id, req.user.userId, body.reason);
      
      return {
        status: 'success',
        message: 'Transaction cancelled successfully',
        data: transaction,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}