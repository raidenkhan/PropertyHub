import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // from JWT
    const { id } = request.params; // e.g., /properties/:id

    if (!user) throw new ForbiddenException('Unauthorized');

    // Decide based on route (Property, Transaction, Message, etc.)
    const route = request.route.path;

    if (route.startsWith('/properties')) {
      const property = await this.prisma.property.findUnique({
        where: { id: Number(id) },
      });
      if (!property) throw new ForbiddenException('Resource not found');
      if (property.ownerId !== user.sub && user.role !== 'ADMIN') {
        throw new ForbiddenException('Not owner of this property');
      }
    }

    if (route.startsWith('/transactions')) {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: Number(id) },
      });
      if (!transaction) throw new ForbiddenException('Resource not found');
      if (
        transaction.buyerId !== user.sub &&
        transaction.sellerId !== user.sub &&
        user.role !== 'ADMIN'
      ) {
        throw new ForbiddenException('Not owner of this transaction');
      }
    }

    return true;
  }
}
