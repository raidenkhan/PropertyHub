import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user, params } = request;

    // Skip for admins
    if (user.isAdmin) {
      return true;
    }

    const resourceId = params.id;
    const resourceType = this.getResourceType(context);

    switch (resourceType) {
      case 'property':
        const property = await this.prisma.property.findUnique({
          where: { id: parseInt(resourceId) }
        });
        return property?.currentOwnerId === user.userId;

      case 'transaction':
        const transaction = await this.prisma.transaction.findUnique({
          where: { id: parseInt(resourceId) }
        });
        return transaction?.buyerId === user.userId || transaction?.sellerId === user.userId;

      default:
        return true;
    }
  }

  private getResourceType(context: ExecutionContext): string {
    const controllerClass = context.getClass();
    const controllerName = controllerClass.name.toLowerCase();
    
    if (controllerName.includes('property')) return 'property';
    if (controllerName.includes('transaction')) return 'transaction';
    
    return 'unknown';
  }
}