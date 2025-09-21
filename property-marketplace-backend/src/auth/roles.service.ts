import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async assignRole(adminId: number, userId: number, roleId: number) {
    // Verify admin has permission to assign roles
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    const adminRoles = admin?.userRoles.map(ur => ur.role.name);
    if (!adminRoles?.includes('SUPER_ADMIN') && !adminRoles?.includes('ADMIN')) {
      throw new ForbiddenException('Insufficient permissions to assign roles');
    }

    // Check if role assignment already exists
    const existingRole = await this.prisma.userRole.findFirst({
      where: { 
        userId: userId,
        roleId: roleId
      }
    });

    if (existingRole) {
      throw new ForbiddenException('User already has this role assigned');
    }

    // Create new role assignment
    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy: adminId
      }
    });
  }

  async removeRole(adminId: number, userId: number, roleId: number) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    const adminRoles = admin?.userRoles.map(ur => ur.role.name);
    if (!adminRoles?.includes('SUPER_ADMIN') && !adminRoles?.includes('ADMIN')) {
      throw new ForbiddenException('Insufficient permissions to remove roles');
    }

    const userRole = await this.prisma.userRole.findFirst({
      where: { 
        userId: userId,
        roleId: roleId
      }
    });

    if (!userRole) {
      throw new NotFoundException('Role assignment not found');
    }

    // Delete the role assignment
    return this.prisma.userRole.delete({
      where: { id: userRole.id }
    });
  }

  async getUserRoles(userId: number) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
        assigner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async getRolePermissions(roleNames: string[]) {
    const roles = await this.prisma.role.findMany({
      where: {
        name: { in: roleNames }
      }
    });

    return roles.flatMap(role => role.permissions);
  }

  // Initialize default roles - run this once
  async initializeRoles() {
    const defaultRoles = [
      {
        name: 'SUPER_ADMIN',
        description: 'Full system access',
        permissions: ['*'] // All permissions
      },
      {
        name: 'ADMIN',
        description: 'Administrative access',
        permissions: [
          'user.create', 'user.read', 'user.update', 'user.delete',
          'property.read', 'property.update', 'property.delete',
          'transaction.read', 'dispute.read', 'report.read'
        ]
      },
      {
        name: 'PROPERTY_VERIFIER',
        description: 'Can verify and approve properties',
        permissions: [
          'property.read', 'property.verify', 'property.approve', 'property.reject'
        ]
      },
      {
        name: 'ESCROW_MANAGER',
        description: 'Manages escrow payments and releases',
        permissions: [
          'transaction.read', 'transaction.update', 'escrow.release', 'escrow.hold'
        ]
      },
      {
        name: 'DISPUTE_RESOLVER',
        description: 'Resolves disputes between users',
        permissions: [
          'dispute.read', 'dispute.update', 'dispute.resolve', 'dispute.escalate'
        ]
      },
      {
        name: 'USER',
        description: 'Regular user access',
        permissions: [
          'property.create', 'property.read', 'property.update.own',
          'transaction.create', 'transaction.read.own', 'message.send', 'message.read.own'
        ]
      }
    ];

    for (const roleData of defaultRoles) {
      await this.prisma.role.upsert({
        where: { name: roleData.name },
        update: {
          description: roleData.description,
          permissions: roleData.permissions
        },
        create: roleData
      });
    }

    return { message: 'Default roles initialized' };
  }
}