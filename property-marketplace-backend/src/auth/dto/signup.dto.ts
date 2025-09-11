import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;
  @IsString()
  name: string;
  @IsString()
  @MinLength(6)
  password: string;
  @IsEnum(Role)
  role?: Role;
  @IsString()
  provider?: string; // e.g. 'GOOGLE' or 'LOCAL'
  @IsString()
  avatar?: string;
}
