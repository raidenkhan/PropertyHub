
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum OfferMessageType {
  GENERAL = 'GENERAL',
  SYSTEM = 'SYSTEM',
  COUNTER_OFFER = 'COUNTER_OFFER',
}

export class SendOfferMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(OfferMessageType)
  messageType?: OfferMessageType = OfferMessageType.GENERAL;
}