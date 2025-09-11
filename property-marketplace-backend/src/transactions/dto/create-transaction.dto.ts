import { IsEnum, IsInt, IsNumber, isNumber } from 'class-validator';

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateTransactionDto {
  @IsInt()
  propertyId: number;

  @IsInt()
  sellerId: number;   // property owner

  @IsEnum(TransactionStatus)
  status: TransactionStatus = TransactionStatus.PENDING;

  @IsNumber()
  amount: number;
}
