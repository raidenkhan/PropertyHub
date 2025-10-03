import { Body, Controller, Post, Get, Req, UseGuards, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    console.log('Signup DTO:', dto); 
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Body('refreshToken') token: string) {
    return this.authService.refreshToken(token);
  }


  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req) {
    const userId = req.user.sub; // Extract user ID from JWT payload
    
    return this.authService.getCurrentUser(userId)
  }


@Post('google/test')
async googleTest(@Body() body: any) {
  const user = await this.authService.validateGoogleUser(body);
  return this.authService.googleLogin(user);
}
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // This initiates the Google OAuth2 login flow
    // The guard will redirect to Google's OAuth page
  }


  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      // Validate and get/create user
      const user = await this.authService.validateGoogleUser(req.user);
      
      // Generate tokens for the user
      const tokens = await this.authService.googleLogin(user);
      
      // You can either:
      // 1. Redirect to frontend with tokens as query params (less secure)
      const frontendUrl = `${process.env.FRONTEND_URL}/auth/success?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`;
      res.redirect(frontendUrl);
      
      // 2. Or return JSON response (if you're handling this via popup/iframe)
      // return tokens;
      
    } catch (error) {
      // Redirect to error page on failure
      const errorUrl = `${process.env.FRONTEND_URL}/auth/error`;
      res.redirect(errorUrl);
    }
  }
    @Get('test')
  testEndpoint() {
    console.log('Auth test endpoint called');
    return { 
      message: 'Auth module is working!', 
      timestamp: new Date().toISOString(),
      googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing',
      googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL
    };
  }
}