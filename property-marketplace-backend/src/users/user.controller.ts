import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/roles.guard';
import { SaveBankDetailsDto } from './dto/save-bank-details.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }


  @Get('payout-providers')
  @UseGuards(JwtAuthGuard)
  async getBankList() {
    try {
      const banks = await this.usersService.getBankList();
      return {
        status: 'success',
        data: banks,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('bank-details')
  @UseGuards(JwtAuthGuard)
  async saveBankDetails(
    @Body() dto: any,
    @Req() req:any,
  ) {
    try {
    
      const updatedUser = await this.usersService.saveBankDetails(
        parseInt(req.user.userId),
        dto.type,
        dto.accountNumber,
        dto.bankCode,
      );
      return {
        status: 'success',
        message: 'Payout details saved successfully.',
        data: updatedUser,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
