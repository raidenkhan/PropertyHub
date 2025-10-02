import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { PaystackService } from 'src/payments/paystack.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService,private payStackService:PaystackService) {}

  async create(dto: CreateUserDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }


  // src/users/users.service.ts




  // ✅ NEW: Create Manager (called by Admin/Super Admin)
  async createManager(dto: { email: string; name: string; password: string; role: string; creatorId: number }) {
    // Validate role
    const validManagerRoles = ['PROPERTY_VERIFIER', 'ESCROW_MANAGER', 'DISPUTE_RESOLVER'];
    if (!validManagerRoles.includes(dto.role)) {
      throw new BadRequestException('Invalid manager role');
    }

    // Validate creator is Admin or Super Admin
    const creator = await this.prisma.user.findUnique({
      where: { id: dto.creatorId },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    const creatorRoles = creator?.userRoles.map(ur => ur.role.name);
    if (!creatorRoles?.includes('SUPER_ADMIN') && !creatorRoles?.includes('ADMIN')) {
      throw new ForbiddenException('Only admins can create managers');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        provider: 'LOCAL',
        createdByAdminId: dto.creatorId,
      }
    });

    // Assign manager role
    const role = await this.prisma.role.findUnique({
      where: { name: dto.role }
    });

    if (!role) {
      throw new BadRequestException('Role not found');
    }

    await this.prisma.userRole.create({
       data:{
        userId: user.id,
        roleId: role.id,
        assignedBy: dto.creatorId,
      }
    });

    return {
      message: 'Manager created successfully',
      userId: user.id,
      email: user.email,
      role: dto.role,
    };
  

  // ... your existing methods (createUser, findAll, findOne, update, remove)
}
// Add this to UserService
async saveBankDetails(userId: number, type: 'nuban' | 'mobile_money', accountNumber: string, bankCode: string) {
  // Get user
  
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException('User not found');
  }

  
    if (!user.name) {
        throw new BadRequestException('User must have a name set in their profile before adding payout details.');
    }

  // Create Paystack recipient
  const recipientCode = await this.payStackService.createRecipient({
    name: user.name,
    type: type,
    account_number:accountNumber,
    bank_code:bankCode,
  });

  if (!recipientCode) {
    throw new BadRequestException('Failed to create payout recipient with Paystack.');
  }

  // Update user
  return this.prisma.user.update({
    where: { id: userId },
     data:{paystackRecipientCode: recipientCode},
     select: { // Only return non-sensitive data
        id: true,
        email: true,
        name: true,
        paystackRecipientCode: true,
      }
  });
}
async getBankList() {
    // Call the new unified method. You can pass a country code if needed.
    return this.payStackService.listPayoutProviders();
  }

}
