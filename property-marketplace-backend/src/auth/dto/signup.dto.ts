import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;
  @IsString()
  name: string;
  @IsString()
  @MinLength(6)
  password: string;
  @IsString()
  provider?: string; // e.g. 'GOOGLE' or 'LOCAL'
  @IsString()
  avatar?: string;
  @IsString()
  @IsOptional()
  phone: string;
}
