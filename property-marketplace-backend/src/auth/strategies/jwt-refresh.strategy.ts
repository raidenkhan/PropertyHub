import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    // Accept refresh token from either:
    // - request body: { refreshToken }
    // - Authorization: Bearer <token>
    const bodyExtractor = (req: Request) => req?.body?.refreshToken || null;
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        bodyExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: any) {
    const headerToken = req.get('authorization')?.replace('Bearer', '').trim();
    const bodyToken = (req as any)?.body?.refreshToken;
    const refreshToken = bodyToken || headerToken || null;
    return { ...payload, refreshToken };
  }
}
