// offers.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCounterOfferDto  } from './dto/create-counter-offer.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondToOfferDto } from './dto/respond-to-offer.dto';
import { SendOfferMessageDto } from './dto/send-offer-message.dto';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new offer on a property
   */
  async createOffer(data: CreateOfferDto & { buyerId: number }) {
    // Verify property exists and is available
    const property = await this.prisma.property.findUnique({
      where: {propertyId:data.propertyId },
      include: { currentOwner: true }
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.status !== 'LISTED') {
      throw new BadRequestException('Property is not available for offers');
    }

    if (property.currentOwnerId === data.buyerId) {
      throw new BadRequestException('You cannot make an offer on your own property');
    }

    // Check for existing pending offers by this buyer
    const existingOffer = await this.prisma.offer.findFirst({
      where: {
        propertyId: data.propertyId,
        buyerId: data.buyerId,
        status: 'PENDING'
      }
    });

    if (existingOffer) {
      throw new BadRequestException('You already have a pending offer on this property');
    }

    // Create the offer
    const offer = await this.prisma.offer.create({
      data: {
        propertyId: data.propertyId,
        buyerId: data.buyerId,
        sellerId: property.currentOwnerId,
        amount: data.amount,
        message: data.message,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        property: { 
          select: { 
            id: true, 
            propertyId: true, 
            title: true, 
            location: true,
            images: true,
            price: true 
          } 
        },
      }
    });

    // Create system message for offer creation
    await this.prisma.offerMessage.create({
      data: {
        offerId: offer.id,
        fromUserId: data.buyerId,
        content: `Offer of ₦${data.amount.toLocaleString()} submitted`,
        messageType: 'SYSTEM'
      }
    });

    return offer;
  }

  /**
   * Get offers for a user (made or received)
   */
  async getUserOffers(userId: number, type: 'made' | 'received' | 'all' = 'all') {
    const where: any = {};

    if (type === 'made') {
      where.buyerId = userId;
    } else if (type === 'received') {
      where.sellerId = userId;
    } else {
      where.OR = [
        { buyerId: userId },
        { sellerId: userId }
      ];
    }

    return this.prisma.offer.findMany({
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
            images: true,
            price: true 
          } 
        },
        counterOffers: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            fromUser: { select: { id: true, name: true } }
          }
        },
        messages: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get offers for a specific property (property owner only)
   */
  async getPropertyOffers(propertyId: string, userId: number) {
    // Verify user owns this property
    const property = await this.prisma.property.findFirst({
      where: {
       propertyId,
        currentOwnerId: userId
      }
    });

    if (!property) {
      throw new ForbiddenException('You can only view offers for your own properties');
    }

    return this.prisma.offer.findMany({
      where: { propertyId },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        counterOffers: {
          orderBy: { createdAt: 'desc' },
          include: {
            fromUser: { select: { id: true, name: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            fromUser: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get a specific offer by ID
   */
  async getOfferById(offerId: string, userId: number) {
    const offer = await this.prisma.offer.findUnique({
      where: { offerId },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        property: { 
          select: { 
            id: true, 
            propertyId: true, 
            title: true, 
            location: true,
            images: true,
            price: true 
          } 
        },
        counterOffers: {
          orderBy: { createdAt: 'desc' },
          include: {
            fromUser: { select: { id: true, name: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            fromUser: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Verify user has access to this offer
    if (offer.buyerId !== userId && offer.sellerId !== userId) {
      throw new ForbiddenException('You do not have permission to view this offer');
    }

    return offer;
  }

  /**
   * Respond to an offer (accept/reject)
   */
  async respondToOffer(offerId: string, userId: number, dto: RespondToOfferDto) {
    const offer = await this.prisma.offer.findUnique({
      where: { offerId },
      include: { property: true }
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.sellerId !== userId) {
      throw new ForbiddenException('Only the property owner can respond to this offer');
    }

    if (offer.status !== 'PENDING') {
      throw new BadRequestException('This offer is no longer pending');
    }

    // Handle different actions
    let updatedOffer;
    let systemMessage: string;

    if (dto.action === 'ACCEPT') {
      updatedOffer = await this.prisma.offer.update({
        where: { offerId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date()
        }
      });
      systemMessage = 'Offer accepted! You can now proceed to payment.';

    } else if (dto.action === 'REJECT') {
      updatedOffer = await this.prisma.offer.update({
        where: { offerId },
        data: {
          status: 'REJECTED',
          respondedAt: new Date()
        }
      });
      systemMessage = 'Offer rejected.';

    } else if (dto.action === 'COUNTER') {
      if (!dto.counterAmount) {
        throw new BadRequestException('Counter amount is required for counter offers');
      }

      // Mark original offer as countered
      updatedOffer = await this.prisma.offer.update({
        where: { offerId },
        data: {
          status: 'COUNTERED',
          respondedAt: new Date()
        }
      });

      // Create counter offer
      await this.prisma.offerCounter.create({
        data: {
          offerId: offer.id,
          fromUserId: userId,
          amount: dto.counterAmount,
          message: dto.message
        }
      });

      systemMessage = `Counter-offer made: ₦${dto.counterAmount.toLocaleString()}`;
    }else {
    throw new BadRequestException(`Invalid action: ${dto.action}`);
  }

    // Create system message
    await this.prisma.offerMessage.create({
      data: {
        offerId: offer.id,
        fromUserId: userId,
        content: dto.message || systemMessage,
        messageType: 'SYSTEM'
      }
    });

    return updatedOffer;
  }

  /**
   * Create a counter-offer
   */
  async createCounterOffer(offerId: string, userId: number, dto: CreateCounterOfferDto) {
    const offer = await this.prisma.offer.findUnique({
      where: { offerId }
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Both buyer and seller can make counter offers
    if (offer.buyerId !== userId && offer.sellerId !== userId) {
      throw new ForbiddenException('You do not have permission to counter this offer');
    }

    if (!['PENDING', 'COUNTERED'].includes(offer.status)) {
      throw new BadRequestException('Cannot counter this offer in its current state');
    }

    // Create counter offer
    const counterOffer = await this.prisma.offerCounter.create({
      data: {
        offerId: offer.id,
        fromUserId: userId,
        amount: dto.amount,
        message: dto.message
      },
      include: {
        fromUser: { select: { id: true, name: true } }
      }
    });

    // Update main offer status
    await this.prisma.offer.update({
      where: { offerId },
      data: { status: 'COUNTERED' }
    });

    // Create system message
    await this.prisma.offerMessage.create({
      data: {
        offerId: offer.id,
        fromUserId: userId,
        content: `Counter-offer: ₦${dto.amount.toLocaleString()}`,
        messageType: 'COUNTER_OFFER'
      }
    });

    return counterOffer;
  }

  /**
   * Respond to a counter-offer
   */
  async respondToCounterOffer(
    offerId: string,
    counterId: number,
    userId: number,
    action: 'ACCEPT' | 'REJECT'
  ) {
    const offer = await this.prisma.offer.findUnique({
      where: { offerId }
    });

    const counterOffer = await this.prisma.offerCounter.findFirst({
      where: {
        id: counterId,
        offerId: offer?.id
      }
    });

    if (!offer || !counterOffer) {
      throw new NotFoundException('Offer or counter-offer not found');
    }

    // User must be involved in the offer but not the creator of this counter
    if (offer.buyerId !== userId && offer.sellerId !== userId) {
      throw new ForbiddenException('You do not have permission to respond to this counter-offer');
    }

    if (counterOffer.fromUserId === userId) {
      throw new BadRequestException('You cannot respond to your own counter-offer');
    }

    let updatedOffer;
    let systemMessage: string;

    if (action === 'ACCEPT') {
      // Accept the counter offer
      await this.prisma.offerCounter.update({
        where: { id: counterId },
        data: { status: 'ACCEPTED' }
      });

      // Update main offer
      updatedOffer = await this.prisma.offer.update({
        where: { offerId },
        data: {
          status: 'ACCEPTED',
          amount: counterOffer.amount, // Update to counter offer amount
          respondedAt: new Date()
        }
      });

      systemMessage = `Counter-offer accepted at ₦${counterOffer.amount.toLocaleString()}`;

    } else {
      // Reject the counter offer
      await this.prisma.offerCounter.update({
        where: { id: counterId },
        data: { status: 'REJECTED' }
      });

      updatedOffer = await this.prisma.offer.update({
        where: { offerId },
        data: { status: 'PENDING' } // Back to pending for further negotiation
      });

      systemMessage = 'Counter-offer rejected';
    }

    // Create system message
    await this.prisma.offerMessage.create({
      data: {
        offerId: offer.id,
        fromUserId: userId,
        content: systemMessage,
        messageType: 'SYSTEM'
      }
    });

    return updatedOffer;
  }

  /**
   * Withdraw an offer (buyer only)
   */
  async withdrawOffer(offerId: string, userId: number) {
    const offer = await this.prisma.offer.findUnique({
      where: { offerId }
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.buyerId !== userId) {
      throw new ForbiddenException('Only the buyer can withdraw this offer');
    }

    if (!['PENDING', 'COUNTERED'].includes(offer.status)) {
      throw new BadRequestException('Cannot withdraw offer in its current state');
    }

    const updatedOffer = await this.prisma.offer.update({
      where: { offerId },
      data: {
        status: 'WITHDRAWN',
        respondedAt: new Date()
      }
    });

    // Create system message
    await this.prisma.offerMessage.create({
      data: {
        offerId: offer.id,
        fromUserId: userId,
        content: 'Offer withdrawn by buyer',
        messageType: 'SYSTEM'
      }
    });

    return updatedOffer;
  }

  /**
   * Send a message on an offer
   */
  async sendOfferMessage(offerId: string, userId: number, dto: SendOfferMessageDto) {
    const offer = await this.prisma.offer.findUnique({
      where: { offerId }
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.buyerId !== userId && offer.sellerId !== userId) {
      throw new ForbiddenException('You do not have permission to message on this offer');
    }

    return this.prisma.offerMessage.create({
      data: {
        offerId: offer.id,
        fromUserId: userId,
        content: dto.content,
        messageType: dto.messageType || 'GENERAL'
      },
      include: {
        fromUser: { select: { id: true, name: true } }
      }
    });
  }

  /**
   * Get messages for an offer
   */
  async getOfferMessages(offerId: string, userId: number) {
    const offer = await this.prisma.offer.findUnique({
      where: { offerId }
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.buyerId !== userId && offer.sellerId !== userId) {
      throw new ForbiddenException('You do not have permission to view messages for this offer');
    }

    return this.prisma.offerMessage.findMany({
      where: { offerId: offer.id },
      include: {
        fromUser: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Mark offer messages as read
   */
  async markOfferMessagesAsRead(offerId: string, userId: number) {
    const offer = await this.prisma.offer.findUnique({
      where: { offerId }
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.buyerId !== userId && offer.sellerId !== userId) {
      throw new ForbiddenException('You do not have permission to mark messages as read');
    }

    await this.prisma.offerMessage.updateMany({
      where: {
        offerId: offer.id,
        fromUserId: { not: userId }, // Don't mark own messages as read
        isRead: false
      },
      data: { isRead: true }
    });
  }

  /**
   * Get offer statistics
   */
  async getOfferStats(userId: number) {
    const [
      totalMade,
      totalReceived,
      pendingMade,
      pendingReceived,
      acceptedMade,
      acceptedReceived,
      rejectedMade,
      rejectedReceived
    ] = await Promise.all([
      this.prisma.offer.count({ where: { buyerId: userId } }),
      this.prisma.offer.count({ where: { sellerId: userId } }),
      this.prisma.offer.count({ where: { buyerId: userId, status: 'PENDING' } }),
      this.prisma.offer.count({ where: { sellerId: userId, status: 'PENDING' } }),
      this.prisma.offer.count({ where: { buyerId: userId, status: 'ACCEPTED' } }),
      this.prisma.offer.count({ where: { sellerId: userId, status: 'ACCEPTED' } }),
      this.prisma.offer.count({ where: { buyerId: userId, status: 'REJECTED' } }),
      this.prisma.offer.count({ where: { sellerId: userId, status: 'REJECTED' } }),
    ]);

    return {
      made: {
        total: totalMade,
        pending: pendingMade,
        accepted: acceptedMade,
        rejected: rejectedMade
      },
      received: {
        total: totalReceived,
        pending: pendingReceived,
        accepted: acceptedReceived,
        rejected: rejectedReceived
      }
    };
  }

  /**
   * Auto-expire offers (to be called by cron job)
   */
  async expireOffers() {
    const expiredOffers = await this.prisma.offer.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: new Date()
        }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    return expiredOffers.count;
  }
}