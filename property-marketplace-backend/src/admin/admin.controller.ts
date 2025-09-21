// src/admin/admin.controller.ts
import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from 'src/users/users.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly userService: UsersService) {} // Inject your UsersService

  @Post('create-manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async createManager(
    @Body() body: { email: string; name: string; password: string; role: string },
    @Req() req,
  ) {
    try {
      // Use your existing createAdmin method or create a new one
      const result = await this.userService.createManager({
        email: body.email,
        name: body.name,
        password: body.password,
        role: body.role,
        creatorId: req.user.userId,
      });

      return {
        status: 'success',
        message: 'Manager created successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}