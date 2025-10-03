import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService
  ) {}

  async signup(dto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new ForbiddenException('User already exists');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    
    // Create user with default USER role
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        password: hashed,
        provider: dto.provider || 'LOCAL',
        avatar: dto.avatar || null,
      },
    });

    // Assign default USER role
    const userRole = await this.prisma.role.findFirst({
      where: { name: 'USER' }
    });

    if (userRole) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: userRole.id,
        }
      });
    }

    const userWithRoles = await this.getUserWithRoles(user.id);
    return this.signToken(userWithRoles);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (!user || (user.provider === 'LOCAL' && !user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.provider === 'LOCAL') {
      const valid = await bcrypt.compare(dto.password, user.password);
      if (!valid) throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account deactivated');
    }

    return this.signToken(user);
  }

  async getUserWithRoles(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { 
            role: true 
          }
        }
      }
    });
  }

  async signToken(user: any) {
    const roles = user.userRoles?.map(ur => ur.role.name) || [];
    const permissions = user.userRoles?.flatMap(ur => ur.role.permissions) || [];

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
      permissions,
      isAdmin: this.isAdmin(roles),
      primaryRole: this.getPrimaryRole(roles)
    };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get<string>('JWT_SECRET'),
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
        primaryRole: this.getPrimaryRole(roles),
        redirectPath: this.getRedirectPath(roles)
      }
    };
  }

  private isAdmin(roles: string[]): boolean {
    return roles.some(role =>
      ['SUPER_ADMIN', 'ADMIN', 'PROPERTY_VERIFIER', 'ESCROW_MANAGER', 'DISPUTE_RESOLVER'].includes(role)
    );
  }

  private getPrimaryRole(roles: string[]): string {
    const roleHierarchy = [
      'SUPER_ADMIN',
      'ADMIN',
      'PROPERTY_VERIFIER',
      'ESCROW_MANAGER',
      'DISPUTE_RESOLVER',
      'USER'
    ];

    for (const role of roleHierarchy) {
      if (roles.includes(role)) return role;
    }

    return 'USER';
  }

  private getRedirectPath(roles: string[]): string {
     const roleRedirectMap = {
    SUPER_ADMIN: '/admin/dashboard',
    ADMIN: '/admin/dashboard',
    PROPERTY_VERIFIER: '/manager/dashboard',
    ESCROW_MANAGER: '/manager/dashboard',
    DISPUTE_RESOLVER: '/manager/dashboard',
    USER: '/',
  };
    for (const role of Object.keys(roleRedirectMap) as (keyof typeof roleRedirectMap)[]) {
    if (roles.includes(role)) {
      return roleRedirectMap[role];
    }
  }
    return '/';
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.getUserWithRoles(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or deactivated');
      }

      return this.signToken(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateGoogleUser(profile: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (existingUser) {
      if (existingUser.provider === 'LOCAL') {
        return await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            provider: 'GOOGLE',
            avatar: profile.picture || existingUser.avatar,
            name: `${profile.firstName} ${profile.lastName}` || existingUser.name,
          },
          include: {
            userRoles: {
              include: { role: true }
            }
          }
        });
      }
      return existingUser;
    }

    // Create new user with Google data and assign USER role
  
    const newUser = await this.prisma.user.create({
      data: {
        email: profile.email,
        name: `${profile.firstName} ${profile.lastName}`,
        avatar: profile.picture,
        password: null,
        provider: 'GOOGLE',
      },
    });

    

    // Assign default USER role
    const userRole = await this.prisma.role.findUnique({
      where: { name: 'USER' }
    });

 

    if (userRole) {
      await this.prisma.userRole.create({
        data: {
          userId: newUser.id,
          roleId: userRole.id,
        }
      });
    }

    return this.getUserWithRoles(newUser.id);
  }

  async googleLogin(user: any) {
    return this.signToken(user);
  }
async getCurrentUser(userId: number) {
    const user = await this.getUserWithRoles(userId);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    const roles = user.userRoles?.map(ur => ur.role.name) || [];
    console.log("User \n\n\n",user)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      phone: user.phone,
      roles,
      primaryRole: this.getPrimaryRole(roles),
      redirectPath: this.getRedirectPath(roles),
      isActive: user.isActive,
      provider: user.provider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
  // Admin-only method to create other admins
  async createAdmin(dto: any, creatorId: number) {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    // Only SUPER_ADMIN can create other admins
    const creatorRoles = creator?.userRoles.map(ur => ur.role.name);
    if (!creatorRoles?.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Only super admins can create admin accounts');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashed,
        provider: 'LOCAL',
        createdByAdminId: creatorId,
      },
    });

    // Assign the specified role
    const role = await this.prisma.role.findUnique({
      where: { name: dto.role }
    });

    if (role) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          assignedBy: creatorId,
        }
      });
    }

    return { message: 'Admin created successfully', userId: user.id };
  }
}