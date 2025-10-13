// dto/create-counter-offer.dto.ts
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCounterOfferDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  message?: string;
}