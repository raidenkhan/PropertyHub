// offers.controller.ts
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
import { OffersService } from './offers.service';
import { CreateCounterOfferDto  } from './dto/create-counter-offer.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondToOfferDto } from './dto/respond-to-offer.dto';
import { SendOfferMessageDto } from './dto/send-offer-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  /**
   * Create a new offer on a property
   */
  @Post()
  async createOffer(@Body() dto: CreateOfferDto, @Req() req) {
    try {
      const offer = await this.offersService.createOffer({
        ...dto,
        buyerId: req.user.userId,
      });
      
      return {
        status: 'success',
        message: 'Offer submitted successfully',
        data: offer,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get all offers for the current user (both made and received)
   */
  @Get('my-offers')
  async getMyOffers(@Req() req, @Query('type') type?: 'made' | 'received' | 'all') {
    try {
      const offers = await this.offersService.getUserOffers(req.user.userId, type || 'all');
      
      return {
        status: 'success',
        data: offers,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get offers for a specific property (property owner only)
   */
  @Get('property/:propertyId')
  async getPropertyOffers(@Param('propertyId') propertyId: string, @Req() req) {
    try {
      const offers = await this.offersService.getPropertyOffers(propertyId, req.user.userId);
      
      return {
        status: 'success',
        data: offers,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get a specific offer details
   */
  @Get(':offerId')
  async getOffer(@Param('offerId') offerId: string, @Req() req) {
    try {
      const offer = await this.offersService.getOfferById(offerId, req.user.userId);
      
      return {
        status: 'success',
        data: offer,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Respond to an offer (accept/reject/counter)
   */
  @Patch(':offerId/respond')
  async respondToOffer(
    @Param('offerId') offerId: string,
    @Body() dto: RespondToOfferDto,
    @Req() req
  ) {
    try {
      const result = await this.offersService.respondToOffer(offerId, req.user.userId, dto);
      
      return {
        status: 'success',
        message: `Offer ${dto.action.toLowerCase()}ed successfully`,
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Create a counter-offer
   */
  @Post(':offerId/counter')
  async createCounterOffer(
    @Param('offerId') offerId: string,
    @Body() dto: CreateCounterOfferDto,
    @Req() req
  ) {
    try {
      const counterOffer = await this.offersService.createCounterOffer(
        offerId,
        req.user.userId,
        dto
      );
      
      return {
        status: 'success',
        message: 'Counter-offer created successfully',
        data: counterOffer,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Respond to a counter-offer
   */
  @Patch(':offerId/counter/:counterId/respond')
  async respondToCounterOffer(
    @Param('offerId') offerId: string,
    @Param('counterId', ParseIntPipe) counterId: number,
    @Body() body: { action: 'ACCEPT' | 'REJECT' },
    @Req() req
  ) {
    try {
      const result = await this.offersService.respondToCounterOffer(
        offerId,
        counterId,
        req.user.userId,
        body.action
      );
      
      return {
        status: 'success',
        message: `Counter-offer ${body.action.toLowerCase()}ed successfully`,
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Withdraw an offer (buyer only)
   */
  @Patch(':offerId/withdraw')
  async withdrawOffer(@Param('offerId') offerId: string, @Req() req) {
    try {
      const offer = await this.offersService.withdrawOffer(offerId, req.user.userId);
      
      return {
        status: 'success',
        message: 'Offer withdrawn successfully',
        data: offer,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Send message on an offer
   */
  @Post(':offerId/messages')
  async sendMessage(
    @Param('offerId') offerId: string,
    @Body() dto: SendOfferMessageDto,
    @Req() req
  ) {
    try {
      const message = await this.offersService.sendOfferMessage(
        offerId,
        req.user.userId,
        dto
      );
      
      return {
        status: 'success',
        message: 'Message sent successfully',
        data: message,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get messages for an offer
   */
  @Get(':offerId/messages')
  async getMessages(@Param('offerId') offerId: string, @Req() req) {
    try {
      const messages = await this.offersService.getOfferMessages(offerId, req.user.userId);
      
      return {
        status: 'success',
        data: messages,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Mark offer messages as read
   */
  @Patch(':offerId/messages/mark-read')
  async markMessagesAsRead(@Param('offerId') offerId: string, @Req() req) {
    try {
      await this.offersService.markOfferMessagesAsRead(offerId, req.user.userId);
      
      return {
        status: 'success',
        message: 'Messages marked as read',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get offer statistics for dashboard
   */
  @Get('stats/summary')
  async getOfferStats(@Req() req) {
    try {
      const stats = await this.offersService.getOfferStats(req.user.userId);
      
      return {
        status: 'success',
        data: stats,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}