import { IsInt, IsOptional, IsString, IsUrl, IsObject } from 'class-validator';

export class InitializePaymentDto {
  @IsInt()
  transactionId: number;

  @IsOptional()
  @IsUrl()
  callback_url?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class VerifyPaymentDto {
  @IsString()
  reference: string;
}

export class WebhookEventDto {
  @IsString()
  event: string;

  @IsObject()
  data: any;
}