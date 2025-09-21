import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PropertyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new property
   */
  async createProperty(userId: number, createPropertyDto: CreatePropertyDto) {
    const data: any = {
    ...createPropertyDto,
    currentOwnerId: userId,
    listedById: userId,
    status: 'DRAFT',
    images: createPropertyDto.images || [],
    specifications: createPropertyDto.specifications || {},
  };

  // Only include coordinates if it exists
  if (createPropertyDto.coordinates) {
    data.coordinates = createPropertyDto.coordinates;
  }
    const property = await this.prisma.property.create({
      data,
      
      include: {
        currentOwner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Create initial history record
    await this.prisma.propertyHistory.create({
      data: {
        propertyId: property.id,
        toOwnerId: userId,
        eventType: 'CREATED',
        notes: 'Property initially created'
      }
    });

    return property;
  }

  /**
   * Find a single property by ID
   */
  async findOne(id: number) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        currentOwner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

   

    if (!property || !property.isVerified) {
      throw new NotFoundException('Property not found or not available');
    }
console.log('Returning property:', property);
    return property;
  }

  /**
   * Search and filter public properties
   */
  async searchProperties(filters: any) {
    const { type, minPrice, maxPrice, location, page, limit, search } = filters;
    
    const where: any = {
      status: 'LISTED',
      isVerified: true
    };

    if (type) {
      where.type = type;
    }
    if (minPrice) {
      where.price = { gte: parseFloat(minPrice) };
    }
    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) };
    }
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    const totalCount = await this.prisma.property.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    const properties = await this.prisma.property.findMany({
      where,
      include: {
        currentOwner: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      properties,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * Get properties owned by a specific user
   */
  async getPropertiesByOwner(ownerId: number, filters: any) {
    const { page, limit, status } = filters;

    const where: any = { currentOwnerId: ownerId };
    if (status) {
      where.status = status;
    }

    const totalCount = await this.prisma.property.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    const properties = await this.prisma.property.findMany({
      where,
      include: {
        currentOwner: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      properties,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * Update an existing property
   */
  async update(id: number, dto: any, userId: number) {
    const property = await this.prisma.property.findUnique({
      where: { id }
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.currentOwnerId !== userId) {
      throw new ForbiddenException('You do not have permission to update this property');
    }
    
    if (property.status === 'LISTED' || property.status === 'VERIFIED') {
        throw new ForbiddenException('Cannot edit a property that is listed or verified. Please delist it first.');
    }
    

    const updatedProperty = await this.prisma.property.update({
      where: { id },
      data: dto
    });

    return updatedProperty;
  }

  /**
   * List a property for sale
   */
  async listProperty(propertyId: number, ownerId: number) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.currentOwnerId !== ownerId) {
      throw new ForbiddenException('Only the owner can list this property');
    }

    if (!property.isVerified) {
      throw new ForbiddenException('Property must be verified before listing');
    }
    
    if (property.status === 'LISTED') {
        throw new BadRequestException('Property is already listed');
    }

    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        status: 'LISTED',
        listedAt: new Date()
      }
    });

    await this.prisma.propertyHistory.create({
      data: {
        propertyId,
        toOwnerId: ownerId,
        eventType: 'LISTED',
        notes: 'Property listed for sale'
      }
    });

    return updatedProperty;
  }
  
  /**
   * Delist a property from sale
   */
  async delistProperty(propertyId: number, ownerId: number) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    
    if (property.currentOwnerId !== ownerId) {
      throw new ForbiddenException('Only the owner can delist this property');
    }
    
    if (property.status !== 'LISTED') {
      throw new BadRequestException('Only a listed property can be delisted');
    }

    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        status: 'DRAFT',
        listedAt: null,
      }
    });

    await this.prisma.propertyHistory.create({
      data: {
        propertyId,
        toOwnerId: ownerId,
        eventType: 'DELISTED',
        notes: 'Property delisted from sale'
      }
    });

    return updatedProperty;
  }

  /**
   * Submit a property for verification
   */
  async submitForVerification(propertyId: number, ownerId: number) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    
    if (property.currentOwnerId !== ownerId) {
      throw new ForbiddenException('Only the owner can submit this property for verification');
    }
    
    if (property.isVerified) {
      throw new BadRequestException('Property is already verified');
    }
    
    if (property.status !== 'DRAFT') {
      throw new BadRequestException('Only a draft property can be submitted for verification');
    }

    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        status: 'PENDING_VERIFICATION'
      }
    });
    
    await this.prisma.propertyHistory.create({
      data: {
        propertyId,
        toOwnerId: ownerId,
        eventType: 'SUBMITTED',
        notes: 'Property submitted for verification'
      }
    });
    
    return updatedProperty;
  }
  
  /**
   * Delete a property
   */
  async remove(propertyId: number, ownerId: number) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    
    if (property.currentOwnerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to delete this property');
    }
    
    if (property.status !== 'DRAFT') {
      throw new ForbiddenException('Only a property in draft status can be deleted');
    }

    await this.prisma.property.delete({
      where: { id: propertyId }
    });
  }

  /**
   * Admin: Get all properties with filters
   */
  async getAllPropertiesAdmin(filters: any) {
    const { page, limit, status, type, search } = filters;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const totalCount = await this.prisma.property.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    const properties = await this.prisma.property.findMany({
      where,
      include: {
        currentOwner: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      properties,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * Admin: Get pending properties for verification
   */
  async getPendingProperties() {
    return this.prisma.property.findMany({
      where: { status: 'PENDING_VERIFICATION' },
      include: {
        currentOwner: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Admin: Verify a property
   */
  async verifyProperty(propertyId: number, verifierId: number, approved: boolean, notes?: string) {
    const verifier = await this.prisma.user.findUnique({
      where: { id: verifierId },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    const verifierRoles = verifier?.userRoles.map(ur => ur.role.name);
    if (!verifierRoles?.includes('PROPERTY_VERIFIER') && !verifierRoles?.includes('ADMIN') && !verifierRoles?.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Insufficient permissions to verify properties');
    }

    const property = await this.prisma.property.findUnique({ where: { id: propertyId }});
    if (!property) {
        throw new NotFoundException('Property not found');
    }
    if (property.status !== 'PENDING_VERIFICATION') {
        throw new BadRequestException('Property must be in pending verification status to be verified');
    }

    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        isVerified: approved,
        verifiedById: verifierId,
        verifiedAt: new Date(),
        //status: approved ? 'VERIFIED' : 'REJECTED'
      }
    });

    await this.prisma.propertyHistory.create({
      data: {
        propertyId,
        toOwnerId: updatedProperty.currentOwnerId,
        eventType: 'VERIFIED',
        notes: notes || (approved ? 'Property verified and approved' : 'Property verification rejected')
      }
    });

    return updatedProperty;
  }
  
  /**
   * Admin: Suspend a property
   */
  async suspendProperty(propertyId: number, verifierId: number, reason: string) {
    const verifier = await this.prisma.user.findUnique({
      where: { id: verifierId },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    const verifierRoles = verifier?.userRoles.map(ur => ur.role.name);
    if (!verifierRoles?.includes('PROPERTY_VERIFIER') && !verifierRoles?.includes('ADMIN') && !verifierRoles?.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Insufficient permissions to suspend properties');
    }
    
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    if (property.status === 'SUSPENDED') {
      throw new BadRequestException('Property is already suspended');
    }
    
    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        status: 'SUSPENDED',
      }
    });
    
    await this.prisma.propertyHistory.create({
      data: {
        propertyId,
        toOwnerId: updatedProperty.currentOwnerId,
        eventType: 'SUSPENDED',
        notes: `Property suspended for reason: ${reason}`
      }
    });
    
    return updatedProperty;
  }
  
  /**
   * Admin: Get property statistics
   */
  async getPropertyStats() {
    const stats = await this.prisma.property.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const typeStats = await this.prisma.property.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    return {
      byStatus: stats.map(s => ({ status: s.status, count: s._count.id })),
      byType: typeStats.map(s => ({ type: s.type, count: s._count.id })),
      totalProperties: await this.prisma.property.count(),
      totalListed: await this.prisma.property.count({ where: { status: 'LISTED' } }),
      totalVerified: await this.prisma.property.count({ where: { isVerified: true } }),
    };
  }
  
  /**
   * Check if a user can edit a property
   */
  async canUserEditProperty(propertyId: number, userId: number) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.currentOwnerId !== userId) {
      return { canEdit: false, reason: 'You are not the owner of this property.' };
    }

    if (property.status !== 'DRAFT') {
      return { canEdit: false, reason: 'Property can only be edited when it is in DRAFT status.' };
    }
    
    return { canEdit: true, reason: null };
  }
  
  /**
   * Get properties by location
   */
  async getPropertiesByLocation(location: string, filters: any) {
    const { page, limit, type, minPrice, maxPrice } = filters;
    
    const where: any = {
      status: 'LISTED',
      isVerified: true,
      location: { contains: location, mode: 'insensitive' }
    };
    
    if (type) {
      where.type = type;
    }
    if (minPrice) {
      where.price = { gte: parseFloat(minPrice) };
    }
    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) };
    }

    const totalCount = await this.prisma.property.count({ where });
    const totalPages = Math.ceil(totalCount / limit);
    
    const properties = await this.prisma.property.findMany({
      where,
      include: {
        currentOwner: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return {
      properties,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * Get similar properties
   */
  async getSimilarProperties(propertyId: number) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });

    if (!property) {
      throw new NotFoundException('Property not found');
    }
    
    return this.prisma.property.findMany({
      where: {
        AND: [
          {
            location: { contains: property.location, mode: 'insensitive' },
          },
          {
            type: property.type,
          },
          {
            NOT: {
              id: propertyId,
            }
          },
          {
            status: 'LISTED'
          }
        ]
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Transfer ownership of a property
   */
  async transferOwnership(propertyId: number, newOwnerId: number, transactionId?: number, price?: number) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { currentOwner: true }
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const oldOwnerId = property.currentOwnerId;

    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        currentOwnerId: newOwnerId,
        soldAt: new Date(),
        status: 'SOLD'
      }
    });

    await this.prisma.propertyHistory.create({
      data: {
        propertyId,
        fromOwnerId: oldOwnerId,
        toOwnerId: newOwnerId,
        transactionId,
        price,
        eventType: 'SOLD',
        notes: transactionId ? `Sold via transaction ${transactionId}` : 'Direct ownership transfer'
      }
    });

    return updatedProperty;
  }

  /**
   * Get a property's history
   */
  async getPropertyHistory(propertyId: number) {
    return this.prisma.propertyHistory.findMany({
      where: { propertyId },
      include: {
        fromOwner: {
          select: { id: true, name: true, email: true }
        },
        toOwner: {
          select: { id: true, name: true, email: true }
        },
        transaction: {
          select: { id: true, transactionId: true, amount: true, status: true }
        }
      },
      orderBy: { eventDate: 'desc' }
    });
  }
}