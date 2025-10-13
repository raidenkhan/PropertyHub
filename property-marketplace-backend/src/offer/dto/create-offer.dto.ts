// dto/create-offer.dto.ts
import { IsInt, IsPositive, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateOfferDto {
  @IsString()
  propertyId: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string; // ISO date string
}



