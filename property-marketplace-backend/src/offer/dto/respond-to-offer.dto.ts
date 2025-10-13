// dto/respond-to-offer.dto.ts
import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';

export enum OfferAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  COUNTER = 'COUNTER',
}

export class RespondToOfferDto {
  @IsEnum(OfferAction)
  action: OfferAction;

  @IsOptional()
  @IsNumber()
  counterAmount?: number;

  @IsOptional()
  @IsString()
  message?: string;
}

