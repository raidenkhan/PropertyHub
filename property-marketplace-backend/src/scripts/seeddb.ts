// src/scripts/database-seeder.ts (or wherever you keep it)
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from 'bcrypt';

export class DatabaseSeeder {
  constructor(private prisma: PrismaService) {}

  async seedDatabase() {
    console.log('🌱 Starting database seeding...');

    // Initialize roles first
    await this.initializeRoles();
    
    // Create super admin if doesn't exist
    await this.createSuperAdmin();

    console.log('✅ Database seeding completed!');
  }

  private async initializeRoles() {
    const roles = [
      {
        name: 'SUPER_ADMIN',
        description: 'Full system access and user management',
        permissions: ['*']
      },
      {
        name: 'ADMIN',
        description: 'Administrative access to most features',
        permissions: [
          'user.read', 'user.update', 'user.delete',
          'property.read', 'property.update', 'property.delete',
          'transaction.read', 'transaction.update',
          'dispute.read', 'dispute.update',
          'report.read', 'report.generate'
        ]
      },
      {
        name: 'PROPERTY_VERIFIER',
        description: 'Can verify and manage property listings',
        permissions: [
          'property.read', 'property.verify', 'property.approve', 
          'property.reject', 'property.update'
        ]
      },
      {
        name: 'ESCROW_MANAGER',
        description: 'Manages escrow payments and transaction completion',
        permissions: [
          'transaction.read', 'transaction.update',
          'escrow.release', 'escrow.hold', 'escrow.refund'
        ]
      },
      {
        name: 'DISPUTE_RESOLVER',
        description: 'Handles user disputes and conflict resolution',
        permissions: [
          'dispute.read', 'dispute.update', 'dispute.resolve',
          'dispute.escalate', 'dispute.close'
        ]
      },
      {
        name: 'USER',
        description: 'Standard user with basic property and transaction access',
        permissions: [
          'property.create', 'property.read', 'property.update.own',
          'property.delete.own', 'transaction.create', 'transaction.read.own',
          'message.send', 'message.read.own', 'dispute.create'
        ]
      }
    ];

    for (const roleData of roles) {
      await this.prisma.role.upsert({
        where: { name: roleData.name },
        update: {
          description: roleData.description,
          permissions: roleData.permissions
        },
        create: roleData
      });
    }

    console.log('✅ Roles initialized');
  }

  private async createSuperAdmin() {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@propertyhub.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

    // ✅ FIX 1: Correct relation name — it's `userRoles`, not `roles`
    const existingSuperAdmin = await this.prisma.user.findFirst({
      where: {
        userRoles: {
          some: {
            role: {
              name: 'SUPER_ADMIN'
            }
          }
        },
        isActive: true // ✅ isActive is on User, not UserRole
      },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (existingSuperAdmin) {
      console.log(`✅ Super admin already exists: ${existingSuperAdmin.email}`);
      return;
    }

    // ✅ FIX 2: Import bcrypt at top — don’t require() inside method
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    // ✅ FIX 3: Create user
    const superAdmin = await this.prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashedPassword,
        name: 'Super Administrator',
        provider: 'LOCAL',
        emailVerified: true,
        isActive: true // ✅ Explicitly set
      }
    });

    // ✅ FIX 4: Get role
    const superAdminRole = await this.prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' }
    });

    if (!superAdminRole) {
      throw new Error('SUPER_ADMIN role not found after initialization. Seeder failed.');
    }

    // ✅ FIX 5: Create UserRole assignment
    await this.prisma.userRole.create({
      data: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
        // assignedBy: null (since no one created the first super admin)
      }
    });

    console.log('✅ Super admin created successfully!');
    console.log(`📧 Email: ${superAdminEmail}`);
    console.log(`🔑 Default Password: ${superAdminPassword}`);
    console.log('⚠️  ⚠️  ⚠️  IMPORTANT: Change this password immediately after first login! ⚠️  ⚠️  ⚠️');
  }
}