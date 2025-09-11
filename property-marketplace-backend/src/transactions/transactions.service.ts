import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, TransactionStatus } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTransactionDto, buyerId: number) {
    return this.prisma.transaction.create({
      data: {
        propertyId: dto.propertyId,
        buyerId,
        sellerId: dto.sellerId,
        amount: dto.amount,
        status: dto.status ?? TransactionStatus.PENDING,
      },
      include: {
        property: true,
        buyer: true,
        seller: true,
      },
    });
  }

  async findAll() {
    return this.prisma.transaction.findMany({
      include: { property: true, buyer: true, seller: true },
    });
  }

  async findOne(id: number) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: { property: true, buyer: true, seller: true },
    });
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return tx;
  }

  async update(id: number, dto: UpdateTransactionDto) {
    return this.prisma.transaction.update({
      where: { id },
      data: dto,
      include: { property: true, buyer: true, seller: true },
    });
  }

  async remove(id: number) {
    return this.prisma.transaction.delete({
      where: { id },
    });
  }
}
