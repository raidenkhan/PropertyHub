import { PropertyType } from '@prisma/client';
import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
  @IsEnum(PropertyType)
  type: PropertyType;

 
}
