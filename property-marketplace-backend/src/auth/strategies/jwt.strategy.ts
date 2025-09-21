// Enhanced JWT Strategy
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'changeme123',
    });
  }

  async validate(payload: any) {
    // Get fresh user data with roles
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (!user || !user.isActive) {
      return null;
    }

    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = user.userRoles.flatMap(ur => ur.role.permissions);

    return { 
      userId: payload.sub, 
      email: payload.email, 
      roles,
      permissions,
      isAdmin: roles.some(role => 
        ['SUPER_ADMIN', 'ADMIN', 'PROPERTY_VERIFIER', 'ESCROW_MANAGER', 'DISPUTE_RESOLVER'].includes(role)
      )
    };
  }
}


// Resource Ownership Guard


