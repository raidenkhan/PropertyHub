import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { 
        email: dto.email, 
        name: dto.name, 
        password: hashed, 
        role: 'BUYER', 
        provider: dto.provider || 'LOCAL', 
        avatar: dto.avatar || null 
      },
    });
    return this.signToken(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.provider !== "LOCAL") {
      throw new UnauthorizedException("Invalid credentials");
    }
    
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email, user.role);
  }

  async signToken(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get<string>('JWT_SECRET'),
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      return this.signToken(payload.sub, payload.email, payload.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateGoogleUser(profile: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingUser) {
      // Update existing user with Google info if needed
      if (existingUser.provider === 'LOCAL') {
        return await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            provider: 'GOOGLE',
            avatar: profile.picture || existingUser.avatar,
            name: `${profile.firstName} ${profile.lastName}` || existingUser.name,
          },
        });
      }
      return existingUser;
    }

    // Create new user with Google data
    return await this.prisma.user.create({
      data: {
        email: profile.email,
        name: `${profile.firstName} ${profile.lastName}`,
        avatar: profile.picture,
        password: null, // No password for Google users
        provider: 'GOOGLE',
        role: 'BUYER', // Default role
      },
    });
  }

  // This method should handle the final login process for Google users
  async googleLogin(user: any) {
    return this.signToken(user.id, user.email, user.role);
  }
}